<?php

namespace Ssh\Exception;

final class SshHostKeyMismatch extends \RuntimeException
{
    public function __construct(public readonly string $fingerprint)
    {
        parent::__construct('Ключ сервера не совпадает с сохранённым');
    }
}
