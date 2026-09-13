<?php

namespace Ts\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Ts\Service\TsWorkitemService;

#[Route('/api/ts', name: 'api_ts_')]
#[Access('ts')]
class TsWorkitemsController extends AbstractController
{
    public function __construct(
        private readonly TsWorkitemService $workitemService,
    ) {
    }

    #[Route('/workspaces', name: 'workspaces_list', methods: ['GET'])]
    public function listWorkspaces(#[CurrentUser] ?User $user): JsonResponse
    {
        return $this->proxy(fn () => $this->workitemService->listWorkspaces($this->requireUser($user)));
    }

    #[Route('/workspaces/{workspace}/workitems', name: 'workitems_list', methods: ['GET'], requirements: ['workspace' => '[^/]+'])]
    public function listWorkitems(string $workspace, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $max = $request->query->get('maxItemsCount');
        $fromToken = $request->query->get('fromToken');
        $mine = filter_var($request->query->get('mine', '0'), FILTER_VALIDATE_BOOLEAN);

        return $this->proxy(fn () => $this->workitemService->listWorkitems(
            $this->requireUser($user),
            $workspace,
            null !== $max && '' !== $max ? (int) $max : 50,
            is_string($fromToken) && '' !== $fromToken ? $fromToken : null,
            $mine,
        ));
    }

    #[Route('/workspaces/{workspace}/workitems/{workitem}', name: 'workitems_get', methods: ['GET'], requirements: ['workspace' => '[^/]+', 'workitem' => '[^/]+'])]
    public function getWorkitem(string $workspace, string $workitem, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->proxy(fn () => $this->workitemService->getWorkitem(
            $this->requireUser($user),
            $workspace,
            $workitem,
        ));
    }

    #[Route('/workspaces/{workspace}/workitems/{workitem}', name: 'workitems_patch', methods: ['PATCH'], requirements: ['workspace' => '[^/]+', 'workitem' => '[^/]+'])]
    public function patchWorkitem(string $workspace, string $workitem, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->proxy(fn () => $this->workitemService->updateWorkitem(
            $this->requireUser($user),
            $workspace,
            $workitem,
            $request->toArray(),
        ));
    }

    private function requireUser(?User $user): User
    {
        if (!$user instanceof User) {
            throw new HttpException(Response::HTTP_UNAUTHORIZED, 'Unauthorized');
        }

        return $user;
    }

    /**
     * @param callable(): mixed $action
     */
    private function proxy(callable $action): JsonResponse
    {
        try {
            $data = $action();
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (HttpException $e) {
            $status = $e->getStatusCode();
            if ($status < 400) {
                $status = Response::HTTP_BAD_GATEWAY;
            }

            return $this->json(['error' => $e->getMessage()], $status);
        } catch (\Throwable $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json($data ?? new \stdClass());
    }
}
