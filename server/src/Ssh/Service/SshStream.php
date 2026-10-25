<?php

namespace Ssh\Service;

use Main\Entity\User;

final class SshStream
{
    public function __construct(
        private readonly SshConnectionManager $connections,
        private readonly SshSessionStore $sessions,
    ) {
    }

    public function run(User $user, string $sessionId): void
    {
        @set_time_limit(0);
        @ini_set('output_buffering', '0');
        @ini_set('zlib.output_compression', '0');
        if (function_exists('apache_setenv')) {
            apache_setenv('no-gzip', '1');
        }
        while (ob_get_level() > 0) {
            ob_end_flush();
        }

        try {
            $ssh = $this->connections->openStream($user, $sessionId);
            $ssh->setTimeout(15);
            $ssh->openShell();
            $ssh->setTimeout(0.1);
        } catch (\Throwable $error) {
            echo $error->getMessage()."\r\n";
            flush();
            $this->sessions->destroy($sessionId);

            return;
        }

        try {
            while (!connection_aborted() && !$this->sessions->isClosed($sessionId)) {
                $chunk = $ssh->read();
                if (is_string($chunk) && '' !== $chunk) {
                    echo $chunk;
                    flush();
                }
                $input = $this->sessions->consumeInput($sessionId);
                if ('' !== $input) {
                    $ssh->write($input);
                }
                if (!$ssh->isConnected()) {
                    break;
                }
            }
        } catch (\Throwable $error) {
            echo "\r\n".$error->getMessage()."\r\n";
            flush();
        } finally {
            try {
                $ssh->disconnect();
            } catch (\Throwable) {
            }
            $this->sessions->destroy($sessionId);
        }
    }
}
