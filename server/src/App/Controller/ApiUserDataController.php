<?php

namespace App\Controller;

use App\Entity\UserAppData;
use App\Repository\UserAppDataRepository;
use App\Service\UserAppDataValidator;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/user-data', name: 'api_user_data_')]
class ApiUserDataController extends AbstractController
{
    public function __construct(
        private readonly UserAppDataRepository $userAppDataRepository,
        private readonly UserAppDataValidator $userAppDataValidator,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $prefix = $request->query->get('prefix');
        if (null !== $prefix && !is_string($prefix)) {
            return $this->json(['message' => 'Query parameter "prefix" must be a string'], Response::HTTP_BAD_REQUEST);
        }

        if (!is_string($prefix) || '' === $prefix) {
            $prefix = null;
        }

        $rows = $this->userAppDataRepository->findByUser($user, $prefix);

        return $this->json([
            'items' => array_map([$this, 'serialize'], $rows),
        ]);
    }

    #[Route('/{code}', name: 'detail', methods: ['GET'], requirements: ['code' => '.+'])]
    public function detail(string $code, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $code = rawurldecode($code);
        $row = $this->userAppDataRepository->findOneByUserCode($user, $code);
        if (null === $row) {
            return $this->json(['message' => 'User data not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($row));
    }

    #[Route('', name: 'upsert', methods: ['PUT'])]
    public function upsert(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = $request->toArray();

        $error = $this->userAppDataValidator->validateItem($payload, $user);
        if (null !== $error) {
            return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
        }

        $row = $this->userAppDataRepository->upsert(
            $user,
            $payload['code'],
            $payload['value']
        );
        $this->entityManager->flush();

        return $this->json($this->serialize($row));
    }

    #[Route('/{code}', name: 'delete', methods: ['DELETE'], requirements: ['code' => '.+'])]
    public function delete(string $code, #[CurrentUser] ?User $user): Response
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $code = rawurldecode($code);
        $deleted = $this->userAppDataRepository->deleteByUserCode($user, $code);
        if (!$deleted) {
            return $this->json(['message' => 'User data not found'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->flush();

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array{code: string, value: mixed, createdAt: string, updatedAt: string}
     */
    private function serialize(UserAppData $row): array
    {
        return [
            'code' => $row->getCode(),
            'value' => $row->getValue(),
            'createdAt' => $row->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $row->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
