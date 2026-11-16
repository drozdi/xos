<?php

namespace Xos\Agent;

final class Loop
{
    public static function run(string $configPath): void
    {
        $config = Config::load($configPath);
        $http = new Http($config);
        $executor = new Executor($config);
        $credentials = Credentials::load($config->stateDir);
        if (!$credentials instanceof Credentials) {
            $credentials = self::enroll($config, $http);
        }
        fwrite(STDOUT, "Агент сервера {$credentials->serverId} подключён к {$config->url}\n");
        if ('websocket' === $config->prefer) {
            fwrite(STDOUT, "WebSocket-хаб ещё не поднят, используется длинный опрос\n");
        }
        while (true) {
            try {
                $state = $executor->state();
                $http->request('POST', '/api/samba/agent/heartbeat', [
                    'time_ms' => $state['time_ms'],
                    'timezone' => $state['timezone'],
                    'ntp' => $state['ntp'],
                    'agent_version' => '1',
                    'state' => $state,
                ], $credentials->secret, 20);
                $poll = $http->request('GET', '/api/samba/agent/poll', null, $credentials->secret, 40);
                foreach (is_array($poll['commands'] ?? null) ? $poll['commands'] : [] as $command) {
                    if (!is_array($command)) {
                        continue;
                    }
                    $result = $executor->run($command);
                    $http->request('POST', '/api/samba/agent/result', [
                        'command_id' => $command['id'] ?? null,
                        'status' => $result['status'],
                        'result' => $result['result'],
                    ], $credentials->secret, 20);
                }
            } catch (\Throwable $error) {
                fwrite(STDERR, $error->getMessage()."\n");
                sleep($config->heartbeatSec);
            }
        }
    }

    private static function enroll(Config $config, Http $http): Credentials
    {
        if ('' === $config->enrollToken || $config->serverId < 1) {
            throw new \RuntimeException('Нет учётных данных и секрета регистрации');
        }
        $executor = new Executor($config);
        $key = sodium_crypto_box_keypair();
        $response = $http->request('POST', '/api/samba/agent/enroll', [
            'token' => $config->enrollToken,
            'server_id' => $config->serverId,
            'seal_public_key' => base64_encode(sodium_crypto_box_publickey($key)),
            'state' => $executor->state(),
        ], null, 20);
        $secret = (string) ($response['agent_secret'] ?? '');
        $serverId = (int) ($response['server_id'] ?? $config->serverId);
        if ('' === $secret) {
            throw new \RuntimeException('Центр не выдал секрет агента');
        }
        $credentials = new Credentials($serverId, $secret);
        $credentials->save($config->stateDir);
        $private = rtrim($config->stateDir, '/\\').'/seal.key';
        file_put_contents($private, sodium_crypto_box_secretkey($key));
        @chmod($private, 0600);

        return $credentials;
    }
}
