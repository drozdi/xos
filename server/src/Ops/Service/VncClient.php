<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class VncClient
{
    public function frame(string $host, int $port, string $password, ?int $x, ?int $y, int $button, ?int $keysym): string
    {
        $printed = str_contains($host, ':') ? '['.$host.']' : $host;
        $errno = 0;
        $error = '';
        $socket = @stream_socket_client('tcp://'.$printed.':'.$port, $errno, $error, 8);
        if (!\is_resource($socket)) {
            throw new BadRequestHttpException('Стол недоступен');
        }
        stream_set_timeout($socket, 8);
        try {
            $banner = $this->read($socket, 12);
            if (!str_starts_with($banner, 'RFB ')) {
                throw new BadRequestHttpException('Это не стол VNC');
            }
            $legacy = str_starts_with(substr($banner, 4, 7), '003.003');
            $this->write($socket, $legacy ? "RFB 003.003\n" : "RFB 003.008\n");
            $this->authenticate($socket, $password, $legacy);
            $this->write($socket, "\x01");
            $width = $this->u16($socket);
            $height = $this->u16($socket);
            $this->read($socket, 16);
            $nameLength = $this->u32($socket);
            if ($nameLength > 256) {
                throw new BadRequestHttpException('Сервер прислал слишком длинное имя');
            }
            if ($nameLength > 0) {
                $this->read($socket, $nameLength);
            }
            if ($width < 1 || $height < 1 || $width * $height > 2_500_000) {
                throw new BadRequestHttpException('Экран слишком большой');
            }
            $this->write($socket, pack('CxxxCCCCnnnCCCxxx', 0, 32, 24, 0, 1, 255, 255, 255, 16, 8, 0));
            $this->write($socket, pack('CxnN', 2, 1, 0));
            if (null !== $x && null !== $y && $button > 0 && $x >= 0 && $y >= 0 && $x < $width && $y < $height) {
                $mask = 1 === $button || 2 === $button || 4 === $button ? $button : 1;
                $this->write($socket, pack('CCnn', 5, $mask, $x, $y));
                $this->write($socket, pack('CCnn', 5, 0, $x, $y));
            }
            if (null !== $keysym && $keysym >= 0 && $keysym <= 0xFFFFFF) {
                $this->write($socket, pack('CCxxN', 4, 1, $keysym));
                $this->write($socket, pack('CCxxN', 4, 0, $keysym));
            }
            $this->write($socket, pack('CCnnnn', 3, 0, 0, 0, $width, $height));
            $raw = $this->rectangles($socket, $width, $height);

            return $this->png($width, $height, $raw);
        } finally {
            fclose($socket);
        }
    }

    /**
     * @param resource $socket
     */
    private function authenticate($socket, string $password, bool $legacy): void
    {
        if ($legacy) {
            $type = $this->u32($socket);
            if (0 === $type) {
                throw new BadRequestHttpException($this->reason($socket));
            }
            if (1 === $type) {
                return;
            }
            if (2 !== $type) {
                throw new BadRequestHttpException('Сервер требует другой тип входа');
            }
            $this->vnc($socket, $password);

            return;
        }
        $count = ord($this->read($socket, 1));
        if (0 === $count) {
            throw new BadRequestHttpException($this->reason($socket));
        }
        $types = array_values(unpack('C*', $this->read($socket, $count)) ?: []);
        $choice = '' !== $password && \in_array(2, $types, true) ? 2 : (\in_array(1, $types, true) ? 1 : 0);
        if (0 === $choice) {
            throw new BadRequestHttpException('Сервер требует другой тип входа');
        }
        $this->write($socket, chr($choice));
        if (2 === $choice) {
            $this->vnc($socket, $password);
        }
        if (0 !== $this->u32($socket)) {
            throw new BadRequestHttpException('Пароль стола не подошёл');
        }
    }

    /**
     * @param resource $socket
     */
    private function vnc($socket, string $password): void
    {
        if ('' === $password) {
            throw new BadRequestHttpException('Укажите пароль');
        }
        $this->write($socket, VncAuth::response($password, $this->read($socket, 16)));
    }

    /**
     * @param resource $socket
     */
    private function reason($socket): string
    {
        $length = $this->u32($socket);
        if ($length < 1 || $length > 200) {
            return 'Сервер отказал во входе';
        }

        return trim($this->read($socket, $length)) ?: 'Сервер отказал во входе';
    }

    /**
     * @param resource $socket
     */
    private function rectangles($socket, int $width, int $height): string
    {
        $canvas = str_repeat("\0", $width * $height * 3);
        for ($guard = 0; $guard < 8; ++$guard) {
            $type = ord($this->read($socket, 1));
            if (0 !== $type) {
                continue;
            }
            $this->read($socket, 1);
            $count = $this->u16($socket);
            if ($count < 1 || $count > 64) {
                throw new BadRequestHttpException('Сервер прислал пустую картинку');
            }
            for ($rect = 0; $rect < $count; ++$rect) {
                $x = $this->u16($socket);
                $y = $this->u16($socket);
                $rectWidth = $this->u16($socket);
                $rectHeight = $this->u16($socket);
                $encoding = $this->u32($socket);
                if (0 !== $encoding) {
                    throw new BadRequestHttpException('Сервер прислал неподдерживаемую картинку');
                }
                if ($rectWidth < 1 || $rectHeight < 1 || $x + $rectWidth > $width || $y + $rectHeight > $height) {
                    throw new BadRequestHttpException('Сервер прислал кадр вне экрана');
                }
                $pixels = $this->read($socket, $rectWidth * $rectHeight * 4);
                $offset = 0;
                for ($py = 0; $py < $rectHeight; ++$py) {
                    $row = (($y + $py) * $width + $x) * 3;
                    for ($px = 0; $px < $rectWidth; ++$px) {
                        $canvas[$row] = $pixels[$offset + 2];
                        $canvas[$row + 1] = $pixels[$offset + 1];
                        $canvas[$row + 2] = $pixels[$offset];
                        $offset += 4;
                        $row += 3;
                    }
                }
            }

            return $canvas;
        }

        throw new BadRequestHttpException('Сервер не прислал картинку');
    }

    private function png(int $width, int $height, string $rgb): string
    {
        $raw = '';
        $stride = $width * 3;
        for ($y = 0; $y < $height; ++$y) {
            $raw .= "\0".substr($rgb, $y * $stride, $stride);
        }
        $compressed = zlib_encode($raw, ZLIB_ENCODING_DEFLATE);
        if (!\is_string($compressed)) {
            throw new BadRequestHttpException('Не удалось собрать картинку');
        }

        return "\x89PNG\r\n\x1a\n"
            .$this->chunk('IHDR', pack('N2C5', $width, $height, 8, 2, 0, 0, 0))
            .$this->chunk('IDAT', $compressed)
            .$this->chunk('IEND', '');
    }

    private function chunk(string $type, string $data): string
    {
        return pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
    }

    /**
     * @param resource $socket
     */
    private function read($socket, int $length): string
    {
        $data = '';
        while (strlen($data) < $length) {
            $chunk = fread($socket, $length - strlen($data));
            $meta = stream_get_meta_data($socket);
            if (!\is_string($chunk) || '' === $chunk || ($meta['timed_out'] ?? false)) {
                throw new BadRequestHttpException('Стол закрыл соединение');
            }
            $data .= $chunk;
            if (($meta['eof'] ?? false) && strlen($data) < $length) {
                throw new BadRequestHttpException('Стол закрыл соединение');
            }
        }

        return $data;
    }

    /**
     * @param resource $socket
     */
    private function write($socket, string $data): void
    {
        $written = fwrite($socket, $data);
        if (false === $written || $written !== strlen($data)) {
            throw new BadRequestHttpException('Стол закрыл соединение');
        }
    }

    /**
     * @param resource $socket
     */
    private function u16($socket): int
    {
        $value = unpack('n', $this->read($socket, 2));

        return \is_array($value) ? (int) $value[1] : 0;
    }

    /**
     * @param resource $socket
     */
    private function u32($socket): int
    {
        $value = unpack('N', $this->read($socket, 4));

        return \is_array($value) ? (int) $value[1] : 0;
    }
}
