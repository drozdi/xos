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
        $listen = Listen::open($config->listen);
        if ($listen instanceof Listen) {
            fwrite(STDOUT, "Слушаю команды на {$config->listen}\n");
        }
        $socket = null;
        while (true) {
            try {
                if ($listen instanceof Listen) {
                    $listen->accept($executor, $credentials->secret);
                }
                if ('websocket' === $config->prefer) {
                    $socket = self::socket($socket, $config, $credentials->secret, $executor, $listen);
                    if ($socket instanceof WsClient) {
                        continue;
                    }
                }
                self::poll($config, $http, $executor, $credentials->secret, 40, $listen);
            } catch (\Throwable $error) {
                fwrite(STDERR, $error->getMessage()."\n");
                if ($socket instanceof WsClient) {
                    $socket->close();
                    $socket = null;
                }
                if ($listen instanceof Listen) {
                    $listen->accept($executor, $credentials->secret);
                    sleep(1);
                    continue;
                }
                sleep($config->heartbeatSec);
            }
        }
    }

    private static function socket(?WsClient $socket, Config $config, string $secret, Executor $executor, ?Listen $listen): ?WsClient
    {
        if (!$socket instanceof WsClient || $socket->closed()) {
            $socket?->close();
            $socket = WsClient::open($config, $secret);
            if (!$socket instanceof WsClient) {
                return null;
            }
            fwrite(STDOUT, "WebSocket к {$config->url} открыт\n");
        }
        $read = [$socket->socket()];
        $listenSocket = $listen?->socket();
        if (is_resource($listenSocket)) {
            $read[] = $listenSocket;
        }
        $write = null;
        $except = null;
        @stream_select($read, $write, $except, min(5, $config->heartbeatSec));
        if ($listen instanceof Listen) {
            $listen->accept($executor, $secret);
        }
        foreach ($socket->pull() as $frame) {
            if ('command' !== ($frame['kind'] ?? '')) {
                continue;
            }
            $result = $executor->run($frame);
            $socket->send([
                'kind' => 'result',
                'command_id' => $frame['id'] ?? null,
                'status' => $result['status'],
                'result' => $result['result'],
            ]);
        }
        static $beat = 0;
        if (time() - $beat >= $config->heartbeatSec) {
            $state = $executor->state();
            $socket->send([
                'kind' => 'heartbeat',
                'time_ms' => $state['time_ms'],
                'timezone' => $state['timezone'],
                'ntp' => $state['ntp'],
                'agent_version' => '1',
                'state' => $state,
            ]);
            $beat = time();
        }
        if ($socket->closed()) {
            $socket->close();

            return null;
        }

        return $socket;
    }

    private static function poll(Config $config, Http $http, Executor $executor, string $secret, int $timeout, ?Listen $listen = null): void
    {
        $tick = $listen instanceof Listen ? static function () use ($listen, $executor, $secret): void {
            $listen->accept($executor, $secret);
        } : null;
        $state = $executor->state();
        $http->request('POST', '/api/samba/agent/heartbeat', [
            'time_ms' => $state['time_ms'],
            'timezone' => $state['timezone'],
            'ntp' => $state['ntp'],
            'agent_version' => '1',
            'state' => $state,
        ], $secret, 20, $tick);
        $poll = $http->request('GET', '/api/samba/agent/poll', null, $secret, $timeout, $tick);
        foreach (is_array($poll['commands'] ?? null) ? $poll['commands'] : [] as $command) {
            if (!is_array($command)) {
                continue;
            }
            $result = $executor->run($command);
            $http->request('POST', '/api/samba/agent/result', [
                'command_id' => $command['id'] ?? null,
                'status' => $result['status'],
                'result' => $result['result'],
            ], $secret, 20);
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
