<?php

namespace Calendar\Controller;

use Calendar\Service\CalendarManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/calendar', name: 'api_calendar_')]
class CalendarController extends AbstractController
{
    #[Route('/calendars', name: 'calendars', methods: ['GET'])]
    public function calendars(#[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($calendarManager->listForUser($user));
    }

    #[Route('/calendars', name: 'calendars_create', methods: ['POST'])]
    public function createCalendar(Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $calendar = $calendarManager->createCalendar($user, $request->toArray());

        return $this->json($calendarManager->serializeCalendar($calendar, $user), Response::HTTP_CREATED);
    }

    #[Route('/calendars/{id}', name: 'calendars_detail', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function calendarDetail(int $id, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $calendar = $calendarManager->getAccessibleCalendar($id, $user);

        return $this->json($calendarManager->serializeCalendar($calendar, $user));
    }

    #[Route('/calendars/{id}', name: 'calendars_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateCalendar(int $id, Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $calendar = $calendarManager->getAccessibleCalendar($id, $user);
        $calendarManager->updateCalendar($calendar, $user, $request->toArray());

        return $this->json($calendarManager->serializeCalendar($calendar, $user));
    }

    #[Route('/calendars/{id}', name: 'calendars_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteCalendar(int $id, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $calendar = $calendarManager->getAccessibleCalendar($id, $user);
        $calendarManager->deleteCalendar($calendar, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/calendars/{id}/share', name: 'calendars_share', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function share(int $id, Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $calendar = $calendarManager->getAccessibleCalendar($id, $user);
        $calendarManager->shareCalendar(
            $calendar,
            $user,
            (string) ($data['email'] ?? ''),
            (string) ($data['permission'] ?? 'read'),
        );

        return $this->json($calendarManager->serializeCalendar($calendar, $user));
    }

    #[Route('/calendars/{id}/share/{userId}', name: 'calendars_unshare', methods: ['DELETE'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    public function unshare(int $id, int $userId, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $calendar = $calendarManager->getAccessibleCalendar($id, $user);
        $calendarManager->unshareCalendar($calendar, $user, $userId);

        return $this->json($calendarManager->serializeCalendar($calendar, $user));
    }

    #[Route('/users/by-email', name: 'users_by_email', methods: ['GET'])]
    public function findByEmail(Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $found = $calendarManager->findUserByEmail((string) $request->query->get('email', ''));
        if (null === $found) {
            throw new NotFoundHttpException('Пользователь не найден');
        }

        return $this->json($found);
    }

    #[Route('/events/query', name: 'events_query', methods: ['POST'])]
    public function queryEvents(Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $start = $this->parseRequiredDateTime($data['start'] ?? null, 'start');
        $end = $this->parseRequiredDateTime($data['end'] ?? null, 'end');

        $calendarIds = null;
        if (array_key_exists('calendar_ids', $data) && null !== $data['calendar_ids']) {
            if (!is_array($data['calendar_ids'])) {
                throw new BadRequestHttpException('calendar_ids должен быть массивом');
            }
            $calendarIds = array_values(array_map('intval', $data['calendar_ids']));
        }

        return $this->json($calendarManager->queryEvents($user, $start, $end, $calendarIds));
    }

    #[Route('/events', name: 'events_create', methods: ['POST'])]
    public function createEvent(Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $event = $calendarManager->createEvent($user, $request->toArray());

        return $this->json($calendarManager->serializeEvent($event), Response::HTTP_CREATED);
    }

    #[Route('/events/{id}', name: 'events_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateEvent(int $id, Request $request, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $event = $calendarManager->getAccessibleEvent($id, $user);
        $calendarManager->updateEvent($event, $user, $request->toArray());

        return $this->json($calendarManager->serializeEvent($event));
    }

    #[Route('/events/{id}', name: 'events_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteEvent(int $id, #[CurrentUser] ?User $user, CalendarManager $calendarManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $event = $calendarManager->getAccessibleEvent($id, $user);
        $calendarManager->deleteEvent($event, $user);

        return $this->json(['ok' => true]);
    }

    private function parseRequiredDateTime(mixed $value, string $field): \DateTimeInterface
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException("Укажите {$field}");
        }
        try {
            return new \DateTime($value);
        } catch (\Exception) {
            throw new BadRequestHttpException("Некорректный {$field}");
        }
    }
}
