<?php

namespace Xos\Agent;

final class Http
{
    public function __construct(private readonly Config $config)
    {
    }

    /**
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    public function request(string $method, string $path, ?array $body, ?string $bearer, int $timeout, ?callable $tick = null): array
    {
        if (!function_exists('curl_init')) {
            throw new \RuntimeException('Нужно расширение curl');
        }
        $curl = curl_init($this->config->url.$path);
        if (false === $curl) {
            throw new \RuntimeException('Не удалось открыть запрос');
        }
        $headers = ['Accept: application/json', 'User-Agent: xos-agent/1', 'Cookie: bm_ssl=1']; // проверка HostiMan перед xos.h1n.ru
        if (null !== $bearer) {
            $headers[] = 'Authorization: Bearer '.$bearer;
        }
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => $headers,
        ];
        if (null !== $body) {
            $headers[] = 'Content-Type: application/json';
            $options[CURLOPT_HTTPHEADER] = $headers;
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_THROW_ON_ERROR);
        }
        if ('' !== $this->config->caFile) {
            $options[CURLOPT_CAINFO] = $this->config->caFile;
        }
        curl_setopt_array($curl, $options);
        if (null !== $tick) {
            $options[\CURLOPT_NOPROGRESS] = false;
            $options[\CURLOPT_PROGRESSFUNCTION] = static function ($curl, $downloadTotal, $downloaded, $uploadTotal, $uploaded) use ($tick): int {
                $tick();

                return 0;
            };
            curl_setopt_array($curl, $options);
        }
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if (!is_string($raw)) {
            throw new \RuntimeException('Сеть: '.$error);
        }
        if ($status < 200 || $status >= 300) {
            $decoded = json_decode($raw, true);
            $message = is_array($decoded) && isset($decoded['message']) ? (string) $decoded['message'] : 'Ответ '.$status;
            throw new \RuntimeException($message);
        }
        if ('' === $raw) {
            return [];
        }
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }
}
