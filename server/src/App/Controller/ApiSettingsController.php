<?php

namespace App\Controller;

use App\Entity\UserSetting;
use App\Repository\UserSettingRepository;
use App\Service\UserSettingValidator;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/settings', name: 'api_settings_')]
class ApiSettingsController extends AbstractController
{
    public function __construct(
        private readonly UserSettingRepository $userSettingRepository,
        private readonly UserSettingValidator $userSettingValidator,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $category = $request->query->get('category');
        if (null !== $category && !is_string($category)) {
            return $this->json(['message' => 'Query parameter "category" must be a string'], Response::HTTP_BAD_REQUEST);
        }

        if (is_string($category) && '' !== $category) {
            $error = $this->userSettingValidator->validateCategory($category);
            if (null !== $error) {
                return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
            }
        } else {
            $category = null;
        }

        $settings = $this->userSettingRepository->findByUser($user, $category);

        return $this->json([
            'items' => array_map([$this, 'serializeSetting'], $settings),
        ]);
    }

    #[Route('/{category}/{key}', name: 'detail', methods: ['GET'], requirements: ['key' => '.+'])]
    public function detail(string $category, string $key, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $error = $this->userSettingValidator->validateCategory($category);
        if (null !== $error) {
            return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
        }

        $key = rawurldecode($key);
        $setting = $this->userSettingRepository->findOneByUserCategoryKey($user, $category, $key);
        if (null === $setting) {
            return $this->json(['message' => 'Setting not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serializeSetting($setting));
    }

    #[Route('', name: 'upsert', methods: ['POST'])]
    public function upsert(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = $request->toArray();

        if (isset($payload['items'])) {
            if (!is_array($payload['items'])) {
                return $this->json(['message' => 'Field "items" must be an array'], Response::HTTP_BAD_REQUEST);
            }

            $saved = [];
            foreach ($payload['items'] as $index => $item) {
                if (!is_array($item)) {
                    return $this->json(['message' => sprintf('Item at index %d must be an object', $index)], Response::HTTP_BAD_REQUEST);
                }

                $error = $this->userSettingValidator->validateItem($item);
                if (null !== $error) {
                    return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
                }

                $saved[] = $this->userSettingRepository->upsert(
                    $user,
                    $item['category'],
                    $item['key'],
                    $item['value']
                );
            }

            $this->entityManager->flush();

            return $this->json([
                'items' => array_map([$this, 'serializeSetting'], $saved),
            ]);
        }

        $error = $this->userSettingValidator->validateItem($payload);
        if (null !== $error) {
            return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
        }

        $setting = $this->userSettingRepository->upsert(
            $user,
            $payload['category'],
            $payload['key'],
            $payload['value']
        );
        $this->entityManager->flush();

        return $this->json($this->serializeSetting($setting));
    }

    #[Route('/{category}/{key}', name: 'delete', methods: ['DELETE'], requirements: ['key' => '.+'])]
    public function delete(string $category, string $key, #[CurrentUser] ?User $user): Response
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $error = $this->userSettingValidator->validateCategory($category);
        if (null !== $error) {
            return $this->json(['message' => $error], Response::HTTP_BAD_REQUEST);
        }

        $key = rawurldecode($key);
        $deleted = $this->userSettingRepository->deleteByUserCategoryKey($user, $category, $key);
        if (!$deleted) {
            return $this->json(['message' => 'Setting not found'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->flush();

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array{category: string, key: string, value: mixed, updatedAt: string}
     */
    private function serializeSetting(UserSetting $setting): array
    {
        return [
            'category' => $setting->getCategory(),
            'key' => $setting->getKey(),
            'value' => $setting->getValue(),
            'updatedAt' => $setting->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
