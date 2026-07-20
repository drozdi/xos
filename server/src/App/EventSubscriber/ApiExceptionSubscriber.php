<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class ApiExceptionSubscriber implements EventSubscriberInterface
{
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
        if (!$throwable instanceof ValidationFailedException) {
            return;
        }

        $violations = [];
        foreach ($throwable->getViolations() as $violation) {
            $violations[$violation->getPropertyPath()] = $violation->getMessage();
        }

        $event->setResponse(new JsonResponse([
            'message' => 'Ошибка валидации',
            'violations' => $violations,
        ], JsonResponse::HTTP_BAD_REQUEST));
    }
}
