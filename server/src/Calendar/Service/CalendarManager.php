<?php

namespace Calendar\Service;

use AbstractManager;
use Calendar\Entity\Calendar;
use Calendar\Entity\CalendarEvent;
use Calendar\Entity\CalendarShare;
use Calendar\Repository\CalendarEventRepository;
use Calendar\Repository\CalendarRepository;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class CalendarManager extends AbstractManager
{
    private const DEFAULT_TITLE = 'Личный';
    private const DEFAULT_COLOR = '#1975d2';

    public function __construct(ValidatorInterface $validator)
    {
        parent::__construct($validator);
    }

    public function getCalendarRepository(): CalendarRepository
    {
        return $this->getEntityManager()->getRepository(Calendar::class);
    }

    public function getEventRepository(): CalendarEventRepository
    {
        return $this->getEntityManager()->getRepository(CalendarEvent::class);
    }

    /** @return list<array<string, mixed>> */
    public function listForUser(User $user): array
    {
        $this->ensureMasterCalendar($user);
        $calendars = $this->getCalendarRepository()->findAccessibleForUser($user);

        return array_map(fn (Calendar $calendar) => $this->serializeCalendar($calendar, $user), $calendars);
    }

    /** Системный календарь «Личный» (master) — один на пользователя, удалить нельзя. */
    public function ensureMasterCalendar(User $user): Calendar
    {
        $master = $this->getCalendarRepository()->findOneBy([
            'owner' => $user,
            'type' => Calendar::TYPE_MASTER,
        ]);
        if ($master instanceof Calendar) {
            return $master;
        }

        $calendar = new Calendar();
        $calendar->setOwner($user);
        $calendar->setTitle(self::DEFAULT_TITLE);
        $calendar->setColor(self::DEFAULT_COLOR);
        $calendar->setType(Calendar::TYPE_MASTER);

        $em = $this->getEntityManager();
        $em->persist($calendar);
        $em->flush();

        return $calendar;
    }

    public function getAccessibleCalendar(int $id, User $user): Calendar
    {
        $calendar = $this->getCalendarRepository()->find($id);
        if (!$calendar instanceof Calendar) {
            throw new NotFoundHttpException('Календарь не найден');
        }
        if (!$this->canRead($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к календарю');
        }

        return $calendar;
    }

    /** Пользовательский календарь (slave). */
    public function createCalendar(User $user, array $data): Calendar
    {
        $calendar = new Calendar();
        $calendar->setOwner($user);
        $calendar->setTitle(trim((string) ($data['title'] ?? self::DEFAULT_TITLE)) ?: self::DEFAULT_TITLE);
        $calendar->setColor($this->normalizeColor($data['color'] ?? null));
        $calendar->setType(Calendar::TYPE_SLAVE);

        $em = $this->getEntityManager();
        $em->persist($calendar);
        $em->flush();

        return $calendar;
    }

    public function updateCalendar(Calendar $calendar, User $user, array $data): Calendar
    {
        if (!$this->canWrite($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение календаря');
        }

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            $calendar->setTitle('' !== $title ? $title : self::DEFAULT_TITLE);
        }
        if (array_key_exists('color', $data)) {
            $calendar->setColor($this->normalizeColor($data['color']));
        }

        $this->getEntityManager()->flush();

        return $calendar;
    }

    public function deleteCalendar(Calendar $calendar, User $user): void
    {
        if (!$this->isOwner($calendar, $user)) {
            throw new AccessDeniedHttpException('Удалить календарь может только владелец');
        }
        if ($calendar->isMaster()) {
            throw new AccessDeniedHttpException('Системный календарь удалить нельзя');
        }

        // shares/events удаляются каскадом (orphanRemoval + onDelete CASCADE)
        $em = $this->getEntityManager();
        $em->remove($calendar);
        $em->flush();
    }

    public function shareCalendar(Calendar $calendar, User $owner, string $email, string $permission): CalendarShare
    {
        if (!$this->isOwner($calendar, $owner)) {
            throw new AccessDeniedHttpException('Делиться может только владелец');
        }
        $permission = strtolower(trim($permission));
        if (!in_array($permission, [CalendarShare::PERMISSION_READ, CalendarShare::PERMISSION_WRITE], true)) {
            throw new BadRequestHttpException('permission: read или write');
        }

        $email = trim($email);
        if ('' === $email) {
            throw new BadRequestHttpException('Укажите email');
        }

        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $target = $users->findOneBy(['email' => $email]);
        if (!$target instanceof User) {
            throw new NotFoundHttpException('Пользователь с таким email не найден');
        }
        if ($target->getId() === $owner->getId()) {
            throw new BadRequestHttpException('Нельзя поделиться с самим собой');
        }

        foreach ($calendar->getShares() as $existing) {
            if ($existing->getUser()?->getId() === $target->getId()) {
                $existing->setPermission($permission);
                $this->getEntityManager()->flush();

                return $existing;
            }
        }

        $share = new CalendarShare();
        $share->setUser($target);
        $share->setPermission($permission);
        $calendar->addShare($share);
        $this->getEntityManager()->persist($share);
        $this->getEntityManager()->flush();

        return $share;
    }

    public function unshareCalendar(Calendar $calendar, User $owner, int $userId): void
    {
        if (!$this->isOwner($calendar, $owner)) {
            throw new AccessDeniedHttpException('Управлять доступом может только владелец');
        }
        foreach ($calendar->getShares() as $share) {
            if ($share->getUser()?->getId() === $userId) {
                $calendar->removeShare($share);
                $this->getEntityManager()->remove($share);
                $this->getEntityManager()->flush();

                return;
            }
        }

        throw new NotFoundHttpException('Доступ не найден');
    }

    /** @return array<string, mixed>|null */
    public function findUserByEmail(string $email): ?array
    {
        $email = trim($email);
        if ('' === $email) {
            return null;
        }
        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $user = $users->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'login' => $user->getLogin(),
        ];
    }

    public function canRead(Calendar $calendar, User $user): bool
    {
        if ($this->isOwner($calendar, $user)) {
            return true;
        }
        foreach ($calendar->getShares() as $share) {
            if ($share->getUser()?->getId() === $user->getId()) {
                return true;
            }
        }

        return false;
    }

    public function canWrite(Calendar $calendar, User $user): bool
    {
        if ($this->isOwner($calendar, $user)) {
            return true;
        }
        foreach ($calendar->getShares() as $share) {
            if ($share->getUser()?->getId() === $user->getId() && $share->canWrite()) {
                return true;
            }
        }

        return false;
    }

    public function isOwner(Calendar $calendar, User $user): bool
    {
        return $calendar->getOwner()?->getId() === $user->getId();
    }

    /** @return array<string, mixed> */
    public function serializeCalendar(Calendar $calendar, User $viewer): array
    {
        $shares = [];
        if ($this->isOwner($calendar, $viewer)) {
            foreach ($calendar->getShares() as $share) {
                $shares[] = [
                    'user_id' => $share->getUser()?->getId(),
                    'alias' => $share->getUser()?->getAlias(),
                    'email' => $share->getUser()?->getEmail(),
                    'permission' => $share->getPermission(),
                ];
            }
        }

        return [
            'id' => $calendar->getId(),
            'title' => $calendar->getTitle(),
            'color' => $calendar->getColor(),
            'type' => $calendar->getType(),
            'is_owner' => $this->isOwner($calendar, $viewer),
            'can_write' => $this->canWrite($calendar, $viewer),
            'can_delete' => $this->isOwner($calendar, $viewer) && $calendar->isSlave(),
            'owner' => [
                'id' => $calendar->getOwner()?->getId(),
                'alias' => $calendar->getOwner()?->getAlias(),
                'email' => $calendar->getOwner()?->getEmail(),
            ],
            'shares' => $shares,
            'created_at' => $calendar->getCreatedAt('Y-m-d H:i:s'),
            'updated_at' => $calendar->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    public function createEvent(User $user, array $data): CalendarEvent
    {
        $calendarId = (int) ($data['calendar_id'] ?? 0);
        if ($calendarId <= 0) {
            throw new BadRequestHttpException('Укажите calendar_id');
        }
        $calendar = $this->getAccessibleCalendar($calendarId, $user);
        if (!$this->canWrite($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет прав на создание события');
        }

        $event = new CalendarEvent();
        $event->setCalendar($calendar);
        $this->applyEventData($event, $data, true);

        $em = $this->getEntityManager();
        $em->persist($event);
        $em->flush();

        return $event;
    }

    public function updateEvent(CalendarEvent $event, User $user, array $data): CalendarEvent
    {
        $calendar = $event->getCalendar();
        if (!$calendar instanceof Calendar || !$this->canWrite($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение события');
        }

        if (array_key_exists('calendar_id', $data)) {
            $newCalendarId = (int) $data['calendar_id'];
            if ($newCalendarId !== $calendar->getId()) {
                $newCalendar = $this->getAccessibleCalendar($newCalendarId, $user);
                if (!$this->canWrite($newCalendar, $user)) {
                    throw new AccessDeniedHttpException('Нет прав на целевой календарь');
                }
                $event->setCalendar($newCalendar);
            }
        }

        $this->applyEventData($event, $data, false);
        $this->getEntityManager()->flush();

        return $event;
    }

    public function deleteEvent(CalendarEvent $event, User $user): void
    {
        $calendar = $event->getCalendar();
        if (!$calendar instanceof Calendar || !$this->canWrite($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет прав на удаление события');
        }
        $em = $this->getEntityManager();
        $em->remove($event);
        $em->flush();
    }

    public function getAccessibleEvent(int $id, User $user): CalendarEvent
    {
        $event = $this->getEventRepository()->find($id);
        if (!$event instanceof CalendarEvent) {
            throw new NotFoundHttpException('Событие не найдено');
        }
        $calendar = $event->getCalendar();
        if (!$calendar instanceof Calendar || !$this->canRead($calendar, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к событию');
        }

        return $event;
    }

    /**
     * @param list<int>|null $calendarIds
     *
     * @return list<array<string, mixed>>
     */
    public function queryEvents(User $user, \DateTimeInterface $start, \DateTimeInterface $end, ?array $calendarIds = null): array
    {
        $events = $this->getEventRepository()->findInRange($user, $start, $end, $calendarIds);

        return array_map(fn (CalendarEvent $event) => $this->serializeEvent($event), $events);
    }

    /** @return array<string, mixed> */
    public function serializeEvent(CalendarEvent $event): array
    {
        $calendar = $event->getCalendar();

        return [
            'id' => $event->getId(),
            'calendar_id' => $calendar?->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'start_at' => $event->getStartAt('Y-m-d\TH:i:s'),
            'end_at' => $event->getEndAt('Y-m-d\TH:i:s'),
            'all_day' => $event->isAllDay(),
            'color' => $calendar?->getColor(),
        ];
    }

    private function applyEventData(CalendarEvent $event, array $data, bool $requireDates): void
    {
        if (array_key_exists('title', $data) || $requireDates) {
            $title = trim((string) ($data['title'] ?? $event->getTitle()));
            if ('' === $title) {
                throw new BadRequestHttpException('Укажите title');
            }
            $event->setTitle($title);
        }

        if (array_key_exists('description', $data)) {
            $description = $data['description'];
            $event->setDescription(null !== $description && '' !== trim((string) $description)
                ? (string) $description
                : null);
        }

        if (array_key_exists('all_day', $data) || $requireDates) {
            $event->setAllDay((bool) ($data['all_day'] ?? $event->isAllDay()));
        }

        $start = $this->parseDateTime($data['start_at'] ?? null, $requireDates ? 'start_at' : null);
        $end = $this->parseDateTime($data['end_at'] ?? null, $requireDates ? 'end_at' : null);

        if (null !== $start) {
            $event->setStartAt($start);
        }
        if (null !== $end) {
            $event->setEndAt($end);
        }

        $startAt = $event->getStartAt();
        $endAt = $event->getEndAt();
        if (!$startAt instanceof \DateTimeInterface || !$endAt instanceof \DateTimeInterface) {
            throw new BadRequestHttpException('Укажите start_at и end_at');
        }
        if ($endAt < $startAt) {
            throw new BadRequestHttpException('end_at не может быть раньше start_at');
        }
    }

    private function parseDateTime(mixed $value, ?string $field): ?\DateTimeInterface
    {
        if (null === $value || '' === $value) {
            if (null !== $field) {
                throw new BadRequestHttpException("Укажите {$field}");
            }

            return null;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value;
        }
        if (!is_string($value)) {
            throw new BadRequestHttpException(null !== $field ? "Некорректный {$field}" : 'Некорректная дата');
        }
        try {
            return new \DateTime($value);
        } catch (\Exception) {
            throw new BadRequestHttpException(null !== $field ? "Некорректный {$field}" : 'Некорректная дата');
        }
    }

    private function normalizeColor(mixed $color): string
    {
        if (!is_string($color) || !preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
            return self::DEFAULT_COLOR;
        }

        return strtolower($color);
    }
}
