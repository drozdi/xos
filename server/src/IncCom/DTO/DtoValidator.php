<?php

namespace IncCom\DTO;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Deserializes request data into DTOs and validates them via Symfony Assert constraints.
 */
class DtoValidator
{
    public function __construct(
        private readonly DenormalizerInterface $denormalizer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    /**
     * Denormalize request data into a DTO and validate constraints.
     *
     * @template T of object
     *
     * @param array<string, mixed> $data
     * @param class-string<T>      $dtoClass
     *
     * @return T
     *
     * @throws ValidationFailedException
     */
    public function validate(array $data, string $dtoClass): object
    {
        /** @var T $dto */
        $dto = $this->denormalizer->denormalize($data, $dtoClass);

        $violations = $this->validator->validate($dto);
        if ($violations->count() > 0) {
            throw new ValidationFailedException($dto, $violations);
        }

        return $dto;
    }

    /**
     * @return array{error: string, violations: array<string, string>}
     */
    public function formatViolations(ConstraintViolationListInterface $violations): array
    {
        $formatted = [];
        foreach ($violations as $violation) {
            $path = $violation->getPropertyPath();
            $formatted[$path] = trim(($formatted[$path] ?? '') . $violation->getMessage());
        }

        return [
            'error' => 'Validation failed',
            'violations' => $formatted,
        ];
    }

    /**
     * Build a JSON 400 response from validation violations.
     */
    public function toJsonResponse(ValidationFailedException $exception): JsonResponse
    {
        return new JsonResponse(
            $this->formatViolations($exception->getViolations()),
            Response::HTTP_BAD_REQUEST,
        );
    }
}
