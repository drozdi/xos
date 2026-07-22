<?php

namespace SchoolTask\Service;

use AbstractManager;
use Main\Entity\User;
use Main\Service\FileManager;
use SchoolTask\Entity\EpEvent;
use SchoolTask\Entity\EpSubject;
use SchoolTask\Entity\EpGroup;
use SchoolTask\Repository\EpEventRepository;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class EventManager extends AbstractManager
{
    /** @var array<int, array{0: string, 1: string}> */
    private const LESSON_TIMES = [
        1 => ['08:00:00', '08:40:00'],
        2 => ['08:50:00', '09:30:00'],
        3 => ['09:50:00', '10:30:00'],
        4 => ['10:40:00', '11:20:00'],
        5 => ['11:40:00', '12:20:00'],
        6 => ['12:30:00', '13:10:00'],
        7 => ['13:20:00', '14:00:00'],
        8 => ['14:10:00', '14:50:00'],
    ];
    public function __construct(
        ValidatorInterface $validator,
        private readonly SchoolTaskManager $schoolTaskManager,
        private readonly FileManager $fileManager,
    ) {
        parent::__construct($validator);
    }

    public function getEpEventRepository(): EpEventRepository
    {
        return $this->getEntityManager()->getRepository(EpEvent::class);
    }

    public function event(mixed $event = null, ?array $arEvent = null): EpEvent
    {
        if (is_int($event) && $event > 0) {
            $event = $this->getEpEventRepository()->find($event);
        }
        if (!($event instanceof EpEvent)) {
            $event = new EpEvent();
        }
        if (empty($arEvent)) {
            return $event;
        }

        return $this->buildEvent($event, $arEvent, $event->getClass());
    }

    public function createEvent(array $arEvent, User $actor, bool $canManageSchedule): EpEvent
    {
        $class = $this->schoolTaskManager->getClassGroup((int) ($arEvent['class_id'] ?? 0));
        if (!$class instanceof EpGroup) {
            throw new \InvalidArgumentException('Класс не найден');
        }
        if (!$canManageSchedule) {
            throw new \RuntimeException('Недостаточно прав для редактирования расписания');
        }

        $first = $this->buildEvent(new EpEvent(), $arEvent, $class, false);
        $repeatUntil = $this->parseRepeatUntil($arEvent);
        if ($repeatUntil instanceof \DateTimeInterface) {
            $first->setRepeatUntil($repeatUntil);
        }
        $this->getEpEventRepository()->save($first);

        if ($repeatUntil instanceof \DateTimeInterface) {
            $start = \DateTime::createFromInterface($first->getStart());
            $end = \DateTime::createFromInterface($first->getEnd());
            $start->modify('+7 days');
            $end->modify('+7 days');
            while ($start <= $repeatUntil) {
                $child = $this->cloneEventSkeleton($first, $start, $end);
                $child->setParent($first);
                $this->getEpEventRepository()->save($child);
                $start->modify('+7 days');
                $end->modify('+7 days');
            }
        }

        $this->getEntityManager()->flush();

        return $first;
    }

    public function editEvent(EpEvent $event, array $arEvent, User $actor, bool $canManageSchedule): EpEvent
    {
        if (!$canManageSchedule) {
            throw new \RuntimeException('Недостаточно прав для редактирования расписания');
        }

        $editType = (string) ($arEvent['editType'] ?? 'one');
        foreach ($this->resolveSeriesTargets($event, $editType) as $target) {
            if ('one' === $editType && $target->getId() !== $event->getId()) {
                continue;
            }
            if ('one' === $editType && $target->getId() === $event->getId() && $event->getParent()) {
                $target->setUpdate(true);
            }
            $this->buildEvent($target, $arEvent, $event->getClass(), false);
        }

        $this->getEntityManager()->flush();

        return $event;
    }

    public function removeEvent(EpEvent $event, array $arEvent, User $actor, bool $canManageSchedule): void
    {
        if (!$canManageSchedule) {
            throw new \RuntimeException('Недостаточно прав для редактирования расписания');
        }

        $editType = (string) ($arEvent['editType'] ?? 'one');
        foreach ($this->resolveSeriesTargets($event, $editType) as $target) {
            if ('one' === $editType && $target->getId() !== $event->getId()) {
                continue;
            }
            $this->removeEventFiles($target);
            $this->getEpEventRepository()->remove($target);
        }

        $this->getEntityManager()->flush();
    }

    public function saveTeacherTask(EpEvent $event, array $arEvent, User $actor): EpEvent
    {
        if ((int) $event->getUser()?->getId() !== (int) $actor->getId()) {
            throw new \RuntimeException('Добавить задание может только учитель!');
        }

        $this->buildEvent($event, $arEvent, $event->getClass(), false);

        $keepIds = array_map('intval', (array) ($arEvent['files'] ?? []));
        foreach ($event->getFiles()->toArray() as $file) {
            if (!in_array((int) $file->getId(), $keepIds, true)) {
                $event->removeFile($file);
                $this->fileManager->remove($file);
            }
        }

        $subjectName = $this->schoolTaskManager->getSubjectForGroup($event->getGroup())?->getName() ?? 'subject';
        $subDir = $this->schoolTaskManager->translit((string) $event->getClass()?->getName())
            .'/'
            .$this->schoolTaskManager->translit((string) $subjectName);

        foreach ($this->fileManager->upload('files', 'task', null, $subDir) as $file) {
            $event->addFile($file);
        }

        $this->getEntityManager()->flush();

        return $event;
    }

    /** @return EpEvent[] */
    public function loadEventsForClass(int $classId, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->getEpEventRepository()->findInRange($start, $end, ['class' => $classId]);
    }

    /** @return EpEvent[] */
    public function loadEventsForTeacher(User $teacher, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->getEpEventRepository()->findInRange($start, $end, ['user' => $teacher->getId()]);
    }

    /** @return array<int, array{lesson_number: int, start: string, end: string}> */
    public function listLessonTemplates(): array
    {
        $items = [];
        foreach (self::LESSON_TIMES as $lessonNumber => $times) {
            $items[] = [
                'lesson_number' => $lessonNumber,
                'start' => $times[0],
                'end' => $times[1],
            ];
        }

        return $items;
    }

    public function serializeCalendarItem(EpEvent $event, string $mode = 'student'): array
    {
        $subject = $this->schoolTaskManager->getSubjectForGroup($event->getGroup());
        $name = $subject?->getName() ?? $event->getGroup()?->getName() ?? $event->getTitle();
        $item = [
            'id' => $event->getId(),
            'name' => $name,
            'start' => $event->getStart('Y-m-d H:i'),
            'end' => $event->getEnd('Y-m-d H:i'),
            'color' => !empty($event->getTheme()) ? 'green' : 'blue',
        ];

        if ('teacher' === $mode) {
            $files = [];
            foreach ($event->getFiles() as $file) {
                $files[$file->getId()] = $file->getOriginalName();
            }
            $item['name'] = $event->getGroup()?->getName() ?? $name;
            $item['files'] = $files;
        }

        if ('editor' === $mode) {
            $item['color'] = 'orange';
        }

        return $item;
    }

    public function serializeEditorDetail(EpEvent $event): array
    {
        $subject = $this->schoolTaskManager->getSubjectForGroup($event->getGroup());

        return [
            'user_id' => $event->getUser()?->getId(),
            'class_id' => $event->getClass()?->getId(),
            'group_id' => $event->getGroup()?->getId(),
            'subject_id' => $subject?->getId(),
            'start' => $event->getStart('Y-m-d H:i:s'),
            'end' => $event->getEnd('Y-m-d H:i:s'),
            'lesson_number' => $event->getLessonNumber(),
            'repeat_until' => $event->getRepeatUntil('Y-m-d H:i:s'),
        ];
    }

    public function serializeStudentDetail(EpEvent $event): array
    {
        $files = [];
        foreach ($event->getFiles() as $file) {
            $files[$file->getOriginalName()] = $file->getFileSRC();
        }

        $result = [
            'theme' => $event->getTheme(),
            'teacher' => $event->getUser()?->getAlias(),
            'email' => $event->getUser()?->getEmail(),
            'ht' => str_replace("\n", '<br />', (string) $event->getHt()),
            'des' => $event->getDescription(),
            'pt' => str_replace("\n", '<br />', (string) $event->getPt()),
            'net' => $event->getNetResource() ? explode("\n", (string) $event->getNetResource()) : [],
        ];
        if ([] !== $files) {
            $result['files'] = $files;
        }

        return $result;
    }

    public function serializeTeacherDetail(EpEvent $event): array
    {
        $files = [];
        foreach ($event->getFiles() as $file) {
            $files[] = [
                'id' => $file->getId(),
                'name' => $file->getOriginalName(),
            ];
        }

        return [
            'theme' => $event->getTheme(),
            'ht' => $event->getHt(),
            'pt' => $event->getPt(),
            'description' => $event->getDescription(),
            'netResource' => $event->getNetResource(),
            'files' => $files,
        ];
    }

    public function getClassInfo(EpGroup $class): array
    {
        return [
            'name' => $class->getName(),
            'teacher' => $class->getUser()?->getAlias(),
        ];
    }

    private function buildEvent(EpEvent $event, array $arEvent, ?EpGroup $class, bool $flush = true): EpEvent
    {
        if ($class instanceof EpGroup) {
            $event->setClass($class);
        } elseif (array_key_exists('class_id', $arEvent)) {
            $event->setClass($this->schoolTaskManager->getClassGroup((int) $arEvent['class_id']));
        }

        if (array_key_exists('group_id', $arEvent)) {
            $group = $this->schoolTaskManager->getEpGroup((int) $arEvent['group_id']);
            $event->setGroup($group);
            $subject = $group ? $this->schoolTaskManager->getSubjectForGroup($group) : null;
            if ($subject instanceof EpSubject) {
                $event->setTitle($subject->getName());
            }
        }

        if (array_key_exists('user_id', $arEvent)) {
            $userId = (int) $arEvent['user_id'];
            $event->setUser($userId > 0 ? $this->getEntityManager()->find(User::class, $userId) : null);
        }

        if (array_key_exists('title', $arEvent)) {
            $event->setTitle((string) $arEvent['title']);
        }
        if (array_key_exists('lesson_number', $arEvent)) {
            $lessonNumber = $arEvent['lesson_number'];
            $event->setLessonNumber(null !== $lessonNumber && '' !== $lessonNumber ? (int) $lessonNumber : null);
        }
        if (array_key_exists('start', $arEvent)) {
            $start = $this->parseDate($arEvent['start']);
            if ($start instanceof \DateTimeInterface) {
                $event->setStart($start);
            }
        }
        if (array_key_exists('end', $arEvent)) {
            $end = $this->parseDate($arEvent['end']);
            if ($end instanceof \DateTimeInterface) {
                $event->setEnd($end);
            }
        }
        if (null !== $event->getLessonNumber()) {
            $this->applyLessonNumberTime($event);
        }
        if (array_key_exists('repeat_until', $arEvent)) {
            $event->setRepeatUntil($this->parseDate($arEvent['repeat_until']));
        }

        $map = [
            'theme' => 'setTheme',
            'description' => 'setDescription',
            'net_resource' => 'setNetResource',
            'netResource' => 'setNetResource',
            'pt' => 'setPt',
            'ht' => 'setHt',
            'zoom_link' => 'setZoomLink',
            'zoomLink' => 'setZoomLink',
            'zoom_in' => 'setZoomIn',
            'zoomIn' => 'setZoomIn',
            'zoom_pas' => 'setZoomPas',
            'zoomPas' => 'setZoomPas',
        ];
        foreach ($map as $field => $setter) {
            if (array_key_exists($field, $arEvent)) {
                $event->{$setter}($arEvent[$field]);
            }
        }

        $errors = $this->getValidator()->validate($event);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arEvent, $errors);
        }

        $this->getEpEventRepository()->save($event, $flush);

        return $event;
    }

    private function applyLessonNumberTime(EpEvent $event): void
    {
        $lessonNumber = $event->getLessonNumber();
        if (null === $lessonNumber || $lessonNumber < 1 || $lessonNumber > 8) {
            return;
        }
        $times = self::LESSON_TIMES[$lessonNumber] ?? null;
        if (null === $times) {
            return;
        }
        $dateSource = $event->getStart() ?? new \DateTime();
        $date = $dateSource->format('Y-m-d');
        $event->setStart(new \DateTime($date.' '.$times[0]));
        $event->setEnd(new \DateTime($date.' '.$times[1]));
    }

    private function cloneEventSkeleton(EpEvent $source, \DateTimeInterface $start, \DateTimeInterface $end): EpEvent
    {
        $event = new EpEvent();
        $event->setClass($source->getClass());
        $event->setGroup($source->getGroup());
        $event->setUser($source->getUser());
        $event->setTitle($source->getTitle());
        $event->setStart($start);
        $event->setEnd($end);
        $event->setLessonNumber($source->getLessonNumber());

        return $event;
    }

    /** @return EpEvent[] */
    private function resolveSeriesTargets(EpEvent $event, string $editType): array
    {
        $root = $event->getParent() ?? $event;
        if ('all' === $editType) {
            $targets = [$root];
            foreach ($root->getChildren()->toArray() as $child) {
                $targets[] = $child;
            }

            return $targets;
        }
        if ('after' === $editType) {
            $targets = [];
            if ($root->getId() === $event->getId() || $event->getStart() <= $root->getStart()) {
                $targets[] = $root;
            }
            foreach ($root->getChildren()->toArray() as $child) {
                if ($child->getStart() >= $event->getStart()) {
                    $targets[] = $child;
                }
            }

            return [] === $targets ? [$event] : $targets;
        }

        return [$event];
    }

    private function removeEventFiles(EpEvent $event): void
    {
        foreach ($event->getFiles()->toArray() as $file) {
            $event->removeFile($file);
            $this->fileManager->remove($file);
        }
    }

    private function parseDate(mixed $value): ?\DateTimeInterface
    {
        if ($value instanceof \DateTimeInterface) {
            return $value;
        }
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }
        $value = str_replace('T', ' ', $value);

        return new \DateTime($value);
    }

    private function parseRepeatUntil(array $arEvent): ?\DateTimeInterface
    {
        if (array_key_exists('repeat_until', $arEvent)) {
            return $this->parseDate($arEvent['repeat_until']);
        }

        return $this->parseDate($arEvent['repeate'] ?? null);
    }
}
