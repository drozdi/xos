<?php

namespace IncCom\FnsClient\Models;

use DateTimeInterface;

final class TemporaryToken
{
    public static function create(string $token, DateTimeInterface $expireTime)
    {
        return new TemporaryToken($token, $expireTime);
    }

    private final function __construct(string $token, DateTimeInterface $expireTime)
    {
        $this->token = $token;
        $this->expireTime = $expireTime;
    }

    private $token;
    private $expireTime;

    public function getToken()
    {
        return $this->token;
    }

    public function getExpireTime()
    {
        return $this->expireTime;
    }
}