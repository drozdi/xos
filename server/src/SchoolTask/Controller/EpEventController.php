<?php

namespace SchoolTask\Controller;

use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use Explorer\Service\ExplorerManager;
use SchoolTask\Entity\EpGroup;
use SchoolTask\Security\SchoolTaskAccessMessages;
use SchoolTask\Service\EventManager;
use SchoolTask\Service\SchoolTaskManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/schooltask/calendar')]
class EpEventController extends AbstractController
{
    #[Route('/classes', methods: ['POST'])]
    public function listClasses(
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (
            !$userScopeResolver->canReadSchooltaskEvent($user)
            && !$userScopeResolver->canUpdateSchooltaskEvent($user)
        ) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        $items = [];
        foreach ($schoolTaskManager->listClasses() as $class) {
            $canEdit = $this->canManageSchedule($user, $class, $schoolTaskManager, $userScopeResolver);
            $canView = $this->canViewClassCalendar($user, $class, $userScopeResolver, $schoolTaskManager);
            if (!$canView && !$canEdit) {
                continue;
            }

            $items[] = [
                'id' => $class->getId(),
                'name' => $class->getName(),
                'teacher' => $class->getUser()?->getAlias(),
                'can_edit' => $canEdit,
            ];
        }

        return $this->json($items);
    }

    #[Route('/{classId}/info', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function classInfo(
        int $classId,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $schoolTaskManager->getClassGroup($classId);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        if (!$this->canViewClassCalendar($user, $class, $userScopeResolver, $schoolTaskManager)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        return $this->json($eventManager->getClassInfo($class));
    }

    #[Route('/{classId}/student/events', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function studentEvents(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $schoolTaskManager->getClassGroup($classId);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        if (!$this->canViewClassCalendar($user, $class, $userScopeResolver, $schoolTaskManager)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        [$start, $end] = $this->parseRange($request);
        $items = [];
        foreach ($eventManager->loadEventsForClass($classId, $start, $end) as $event) {
            $items[] = $eventManager->serializeCalendarItem($event, 'student');
        }

        return $this->json($items);
    }

    #[Route('/{classId}/student/events/{id}', requirements: ['classId' => '\d+', 'id' => '\d+'], methods: ['GET'])]
    public function studentEventDetail(
        int $classId,
        int $id,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $schoolTaskManager->getClassGroup($classId);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        if (!$this->canViewClassCalendar($user, $class, $userScopeResolver, $schoolTaskManager)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        $event = $eventManager->event($id);
        if (!(int) $event->getId() || (int) $event->getClass()?->getId() !== $classId) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        return $this->json($eventManager->serializeStudentDetail($event));
    }

    #[Route('/{classId}/editor/events', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorEvents(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver, false);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        [$start, $end] = $this->parseRange($request);
        $items = [];
        foreach ($eventManager->loadEventsForClass($classId, $start, $end) as $event) {
            $items[] = $eventManager->serializeCalendarItem($event, 'editor');
        }

        return $this->json($items);
    }

    #[Route('/{classId}/editor/subgroups', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorSubgroups(
        int $classId,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver, false);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $items = [];
        foreach ($class->getChildren() as $group) {
            $items[] = ['value' => $group->getId(), 'text' => $group->getName()];
        }

        return $this->json($items);
    }

    #[Route('/{classId}/editor/teachers', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorTeachers(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver, false);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $subject = $schoolTaskManager->subject((int) $request->toArray()['subject_id']);
        $items = [];
        foreach ($schoolTaskManager->getTeachersForSubject($subject) as $teacher) {
            $items[] = ['value' => $teacher->getId(), 'text' => $teacher->getAlias()];
        }

        return $this->json($items);
    }

    #[Route('/{classId}/editor/events/add', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorAdd(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $payload = array_merge($request->toArray(), ['class_id' => $classId]);
        try {
            $event = $eventManager->createEvent(
                $payload,
                $user,
                $this->canManageSchedule($user, $class, $schoolTaskManager, $userScopeResolver),
            );
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        $subject = $schoolTaskManager->getSubjectForGroup($event->getGroup());

        return $this->json([
            'id' => $event->getId(),
            'user_id' => $event->getUser()?->getId(),
            'class_id' => $event->getClass()?->getId(),
            'group_id' => $event->getGroup()?->getId(),
            'name' => $subject?->getName(),
            'subject_id' => $subject?->getId(),
            'start' => $event->getStart('Y-m-d H:i:s'),
            'end' => $event->getEnd('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{classId}/editor/events/edit', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorEdit(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $payload = $request->toArray();
        unset($payload['group_id'], $payload['class_id']);
        $event = $eventManager->event((int) ($payload['id'] ?? 0));
        if (!(int) $event->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        try {
            $event = $eventManager->editEvent(
                $event,
                $payload,
                $user,
                $this->canManageSchedule($user, $class, $schoolTaskManager, $userScopeResolver),
            );
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'start' => $event->getStart('Y-m-d H:i:s'),
            'end' => $event->getEnd('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{classId}/editor/events/remove', requirements: ['classId' => '\d+'], methods: ['POST'])]
    public function editorRemove(
        int $classId,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $payload = $request->toArray();
        $event = $eventManager->event((int) ($payload['id'] ?? 0));
        if (!(int) $event->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        try {
            $eventManager->removeEvent(
                $event,
                $payload,
                $user,
                $this->canManageSchedule($user, $class, $schoolTaskManager, $userScopeResolver),
            );
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([]);
    }

    #[Route('/{classId}/editor/events/{id}', requirements: ['classId' => '\d+', 'id' => '\d+'], methods: ['POST'])]
    public function editorDetail(
        int $classId,
        int $id,
        SchoolTaskManager $schoolTaskManager,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $this->requireClassEditor($classId, $user, $schoolTaskManager, $userScopeResolver, false);
        if ($class instanceof JsonResponse) {
            return $class;
        }

        $event = $eventManager->event($id);
        if (!(int) $event->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        return $this->json($eventManager->serializeEditorDetail($event));
    }

    #[Route('/lesson-templates', methods: ['GET'])]
    public function lessonTemplates(EventManager $eventManager, UserScopeResolver $userScopeResolver, #[CurrentUser] User $user): JsonResponse
    {
        if (!$userScopeResolver->canReadSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        return $this->json($eventManager->listLessonTemplates());
    }

    #[Route('/teacher/files', methods: ['POST'])]
    public function teacherFiles(
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskEvent($user) && !$userScopeResolver->canUpdateSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        return $this->json($eventManager->listTeacherFiles($user));
    }

    #[Route('/teacher/files/upload', methods: ['POST'])]
    public function teacherFilesUpload(
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskEvent($user) && !$userScopeResolver->canUpdateSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_EVENT);
        }

        try {
            $items = $eventManager->uploadTeacherFiles($user);
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($items, Response::HTTP_CREATED);
    }

    #[Route('/teacher/files/import', methods: ['POST'])]
    public function teacherFilesImport(
        Request $request,
        EventManager $eventManager,
        ExplorerManager $explorerManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskEvent($user) && !$userScopeResolver->canUpdateSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_EVENT);
        }

        $path = trim((string) ($request->toArray()['path'] ?? ''));
        if ($path === '') {
            return ApiResponse::badRequest('Path is required');
        }

        try {
            $info = $explorerManager->info($user, $path);
            if (($info['type'] ?? '') !== 'file') {
                return ApiResponse::badRequest('Only files can be imported');
            }
            $absolute = $explorerManager->resolveAbsolutePath($user, $path);
            $originalName = (string) ($info['name'] ?? basename($path));
            $item = $eventManager->importTeacherFileFromLocalPath($user, $absolute, $originalName);
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($item, Response::HTTP_CREATED);
    }

    #[Route('/teacher/events', methods: ['POST'])]
    public function teacherEvents(
        Request $request,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskEvent($user) && !$userScopeResolver->canUpdateSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        [$start, $end] = $this->parseRange($request);
        $items = [];
        foreach ($eventManager->loadEventsForTeacher($user, $start, $end) as $event) {
            $items[] = $eventManager->serializeCalendarItem($event, 'teacher');
        }

        return $this->json($items);
    }

    #[Route('/teacher/events/{id}', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function teacherDetail(
        int $id,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskEvent($user) && !$userScopeResolver->canUpdateSchooltaskEvent($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
        }

        $event = $eventManager->event($id);
        if (!(int) $event->getId() || (int) $event->getUser()?->getId() !== (int) $user->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        return $this->json($eventManager->serializeTeacherDetail($event));
    }

    #[Route('/teacher/events/save', methods: ['POST'])]
    public function teacherSave(
        Request $request,
        EventManager $eventManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $payload = $request->request->all()['event'] ?? $request->toArray();
        if (!is_array($payload)) {
            $payload = $request->toArray();
        }

        $event = $eventManager->event((int) ($payload['id'] ?? 0));
        if (!(int) $event->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::EVENT_NOT_FOUND);
        }

        if ((int) $event->getUser()?->getId() !== (int) $user->getId()) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_EVENT);
        }

        try {
            $eventManager->saveTeacherTask($event, $payload, $user);
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([]);
    }

    private function canManageSchedule(
        User $user,
        EpGroup $class,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
    ): bool {
        return $userScopeResolver->canUpdateSchooltaskEvent($user)
            || $schoolTaskManager->isClassTutor($user, $class);
    }

    private function requireClassEditor(
        int $classId,
        User $user,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        bool $write = true,
    ): JsonResponse|EpGroup {
        $class = $schoolTaskManager->getClassGroup($classId);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        $allowed = $write
            ? ($userScopeResolver->canUpdateSchooltaskEvent($user) || $schoolTaskManager->isClassTutor($user, $class))
            : ($userScopeResolver->canReadSchooltaskEvent($user) || $schoolTaskManager->isClassTutor($user, $class));
        if (!$allowed) {
            return ApiResponse::forbidden($write ? SchoolTaskAccessMessages::UPDATE_EVENT : SchoolTaskAccessMessages::READ_EVENT);
        }

        return $class;
    }

    private function canViewClassCalendar(
        User $user,
        EpGroup $class,
        UserScopeResolver $userScopeResolver,
        SchoolTaskManager $schoolTaskManager,
    ): bool {
        return $userScopeResolver->canReadSchooltaskEvent($user)
            || $schoolTaskManager->isClassMember($user, $class)
            || $schoolTaskManager->isClassTutor($user, $class);
    }

    /** @return array{0: \DateTimeInterface, 1: \DateTimeInterface} */
    private function parseRange(Request $request): array
    {
        $payload = $request->toArray();
        $start = new \DateTime(str_replace('T', ' ', (string) ($payload['start'] ?? 'now')));
        $end = new \DateTime(str_replace('T', ' ', (string) ($payload['end'] ?? 'now')));

        return [$start, $end];
    }
}
