<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class VncAuth
{
    public static function response(string $password, string $challenge): string
    {
        if (16 !== strlen($challenge)) {
            throw new BadRequestHttpException('Сервер прислал пустой вызов');
        }
        $key = substr(str_pad(substr($password, 0, 8), 8, "\0"), 0, 8);
        $flipped = '';
        for ($i = 0; $i < 8; ++$i) {
            $flipped .= chr(self::reverseByte(ord($key[$i])));
        }
        $cipher = openssl_encrypt($challenge, 'DES-ECB', $flipped, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING);
        if (!\is_string($cipher) || 16 !== strlen($cipher)) {
            throw new BadRequestHttpException('Не удалось выполнить вход VNC');
        }

        return $cipher;
    }

    public static function reverseByte(int $byte): int
    {
        $reversed = 0;
        for ($bit = 0; $bit < 8; ++$bit) {
            $reversed = ($reversed << 1) | ($byte & 1);
            $byte >>= 1;
        }

        return $reversed;
    }
}
