<?php

namespace Github\Controller;

use App\Attribute\Access;
use Github\Service\GithubIssueService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/github', name: 'api_github_')]
#[Access('github')]
class GithubIssuesController extends AbstractController
{
    public function __construct(
        private readonly GithubIssueService $issueService,
    ) {
    }

    #[Route('/issues', name: 'issues_list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $owner = $request->query->get('owner');
        $repo = $request->query->get('repo');
        $state = (string) $request->query->get('state', 'open');
        $perPage = (int) $request->query->get('per_page', 30);
        $page = (int) $request->query->get('page', 1);

        return $this->proxy(fn () => $this->issueService->listIssues(
            $this->requireUser($user),
            is_string($owner) ? $owner : null,
            is_string($repo) ? $repo : null,
            $state,
            $perPage,
            $page,
        ));
    }

    #[Route('/issues/{number}', name: 'issues_get', methods: ['GET'], requirements: ['number' => '\d+'])]
    public function get(int $number, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $owner = $request->query->get('owner');
        $repo = $request->query->get('repo');

        return $this->proxy(fn () => $this->issueService->getIssue(
            $this->requireUser($user),
            $number,
            is_string($owner) ? $owner : null,
            is_string($repo) ? $repo : null,
        ));
    }

    #[Route('/issues/{number}', name: 'issues_patch', methods: ['PATCH'], requirements: ['number' => '\d+'])]
    public function patch(int $number, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $payload = $request->toArray();
        $owner = $payload['owner'] ?? $request->query->get('owner');
        $repo = $payload['repo'] ?? $request->query->get('repo');
        unset($payload['owner'], $payload['repo']);

        return $this->proxy(fn () => $this->issueService->updateIssue(
            $this->requireUser($user),
            $number,
            $payload,
            is_string($owner) ? $owner : null,
            is_string($repo) ? $repo : null,
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
