<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.components>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\Utils;

use Symfony\Component\Console\Exception\InvalidArgumentException;
use function Symfony\Component\String\u;

/**
 * This class is used to provide an example of integrating simple classes as
 * services into a Symfony application.
 * See https://symfony.com/doc/current/service_container.html#creating-configuring-services-in-the-container.
 *
 * @author Javier Eguiluz <javier.eguiluz@gmail.components>
 */
final class Validator
{
    public function validateLogin(?string $login): string
    {
        if (empty($login)) {
            throw new InvalidArgumentException('The username can not be empty.');
        }

        /*if (1 !== preg_match('/^[a-z_]+$/', $login)) {
            throw new InvalidArgumentException('The username must contain only lowercase latin characters and underscores.');
        }*/

        return $login;
    }

    public function validatePassword(?string $plainPassword): string
    {
        if (empty($plainPassword)) {
            throw new InvalidArgumentException('The password can not be empty.');
        }

        if (u($plainPassword)->trim()->length() < 6) {
            throw new InvalidArgumentException('The password must be at least 6 characters long.');
        }

        return $plainPassword;
    }

    public function validateEmail(?string $email): string
    {
        if (empty($email)) {
            throw new InvalidArgumentException('The email can not be empty.');
        }

        if (null === u($email)->indexOf('@')) {
            throw new InvalidArgumentException('The email should look like a real email.');
        }

        return $email;
    }

    public function validateAlias(?string $alias): string
    {
        if (empty($alias)) {
            throw new InvalidArgumentException('The full name can not be empty.');
        }

        return $alias;
    }
}
