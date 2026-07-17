<?php

namespace IncCom\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Request body for POST /api/auth/register.
 */
class RegisterUserRequest
{
    #[Assert\NotBlank(message: 'Login is required')]
    public ?string $login = null;

    #[Assert\NotBlank(message: 'Password is required')]
    public ?string $password = null;

    #[Assert\NotBlank(message: 'Email is required')]
    #[Assert\Email(message: 'Invalid email address')]
    public ?string $email = null;

    public ?string $name = null;
}
