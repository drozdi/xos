<?php

namespace Todo\Controller;

use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Todo\Service\TodoManager;

#[Route('/api/todo', name: 'api_todo_')]
class TodoListController extends AbstractController
{
    #[Route('/lists', name: 'lists', methods: ['GET'])]
    public function lists(#[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($todoManager->listForUser($user));
    }

    #[Route('/lists', name: 'lists_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $todoManager->createList($user, $request->toArray());

        return $this->json($todoManager->serializeListDetail($list, $user), Response::HTTP_CREATED);
    }

    #[Route('/lists/{id}', name: 'lists_detail', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function detail(int $id, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $todoManager->getAccessibleList($id, $user);

        return $this->json($todoManager->serializeListDetail($list, $user));
    }

    #[Route('/lists/{id}', name: 'lists_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $todoManager->getAccessibleList($id, $user);
        $todoManager->updateList($list, $user, $request->toArray());

        return $this->json($todoManager->serializeListDetail($list, $user));
    }

    #[Route('/lists/{id}', name: 'lists_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $todoManager->getAccessibleList($id, $user);
        $todoManager->deleteList($list, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/lists/{id}/share', name: 'lists_share', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function share(int $id, Request $request, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $list = $todoManager->getAccessibleList($id, $user);
        $todoManager->shareList(
            $list,
            $user,
            (string) ($data['email'] ?? ''),
            (string) ($data['permission'] ?? 'read'),
        );

        return $this->json($todoManager->serializeListDetail($list, $user));
    }

    #[Route('/lists/{id}/share/{userId}', name: 'lists_unshare', methods: ['DELETE'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    public function unshare(int $id, int $userId, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $todoManager->getAccessibleList($id, $user);
        $todoManager->unshareList($list, $user, $userId);

        return $this->json($todoManager->serializeListDetail($list, $user));
    }

    #[Route('/users/by-email', name: 'users_by_email', methods: ['GET'])]
    public function findByEmail(Request $request, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $found = $todoManager->findUserByEmail((string) $request->query->get('email', ''));
        if (null === $found) {
            throw new NotFoundHttpException('Пользователь не найден');
        }

        return $this->json($found);
    }

    #[Route('/items/due', name: 'items_due', methods: ['GET'])]
    public function itemsDue(Request $request, #[CurrentUser] ?User $user, TodoManager $todoManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $startRaw = (string) $request->query->get('start', '');
        $endRaw = (string) $request->query->get('end', '');
        if ('' === trim($startRaw) || '' === trim($endRaw)) {
            throw new BadRequestHttpException('Укажите start и end (ISO datetime)');
        }
        try {
            $start = new \DateTime($startRaw);
            $end = new \DateTime($endRaw);
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректный start или end');
        }

        return $this->json($todoManager->findDueItemsInRange($user, $start, $end));
    }
}
