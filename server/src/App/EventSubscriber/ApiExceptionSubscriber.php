<?php

namespace App\EventSubscriber;

use App\Exception\UserFacingException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onException',
        ];
    }

    public function onException(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $throwable = $event->getThrowable();
        if ($throwable instanceof ValidationFailedException) {
            $violations = [];
            foreach ($throwable->getViolations() as $violation) {
                $violations[$violation->getPropertyPath()] = $violation->getMessage();
            }
            $event->setResponse(new JsonResponse([
                'message' => 'Ошибка валидации',
                'violations' => $violations,
            ], JsonResponse::HTTP_BAD_REQUEST));

            return;
        }

        if ($throwable instanceof AccessDeniedException) {
            $event->setResponse(new JsonResponse([
                'message' => $throwable->getMessage() !== '' ? $throwable->getMessage() : 'Доступ запрещён',
            ], JsonResponse::HTTP_FORBIDDEN));

            return;
        }

        if ($throwable instanceof HttpExceptionInterface) {
            $event->setResponse(new JsonResponse([
                'message' => $throwable->getMessage() !== '' ? $throwable->getMessage() : 'Ошибка запроса',
            ], $throwable->getStatusCode()));

            return;
        }

        if ($throwable instanceof UserFacingException) {
            $event->setResponse(new JsonResponse([
                'message' => $throwable->getMessage() !== '' ? $throwable->getMessage() : 'Некорректный запрос',
            ], JsonResponse::HTTP_BAD_REQUEST));

            return;
        }

        if ($throwable instanceof \InvalidArgumentException) {
            $event->setResponse(new JsonResponse([
                'message' => 'Некорректный запрос',
            ], JsonResponse::HTTP_BAD_REQUEST));

            return;
        }

        $payload = ['message' => 'Внутренняя ошибка'];
        if ('prod' !== $this->environment) {
            $payload['detail'] = $throwable->getMessage();
        }
        $event->setResponse(new JsonResponse($payload, JsonResponse::HTTP_INTERNAL_SERVER_ERROR));
    }
}
