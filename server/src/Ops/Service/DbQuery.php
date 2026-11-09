<?php

namespace Ops\Service;

use Ops\Entity\OpsLink;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class DbQuery
{
    public function __construct(private readonly SshSecretCipher $cipher)
    {
    }

    /**
     * @return array{columns: list<string>, rows: list<list<string|null>>, affected: int, truncated: bool}
     */
    public function run(OpsLink $link, string $sql): array
    {
        $sql = DbStatementGuard::assert($sql);
        if (!\in_array($link->getDriver(), ['mysql', 'pgsql'], true)) {
            throw new BadRequestHttpException('Драйвер заполнен неверно');
        }
        $host = str_contains($link->getHost(), ':') ? '['.$link->getHost().']' : $link->getHost();
        $dsn = 'mysql' === $link->getDriver()
            ? 'mysql:host='.$host.';port='.$link->getPort().';dbname='.$link->getDatabaseName().';charset=utf8mb4'
            : 'pgsql:host='.$host.';port='.$link->getPort().';dbname='.$link->getDatabaseName();
        $options = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_TIMEOUT => 8,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ];
        if ('mysql' === $link->getDriver() && \defined('PDO::MYSQL_ATTR_MULTI_STATEMENTS')) {
            $options[\PDO::MYSQL_ATTR_MULTI_STATEMENTS] = false;
        }
        try {
            $pdo = new \PDO($dsn, $link->getUsername(), $this->cipher->decrypt($link->getSecret()), $options);
            try {
                if ('mysql' === $link->getDriver()) {
                    $pdo->exec('SET SESSION max_execution_time = 8000');
                } else {
                    $pdo->exec("SET statement_timeout = '8s'");
                }
            } catch (\PDOException) {
            }
            $statement = $pdo->query($sql);
        } catch (\PDOException $error) {
            throw new BadRequestHttpException($this->message($error));
        }
        if (!$statement instanceof \PDOStatement) {
            throw new BadRequestHttpException('Запрос не выполнен');
        }
        if (0 === $statement->columnCount()) {
            return [
                'columns' => [],
                'rows' => [],
                'affected' => $statement->rowCount(),
                'truncated' => false,
            ];
        }
        $columns = [];
        for ($i = 0; $i < $statement->columnCount(); ++$i) {
            $meta = $statement->getColumnMeta($i);
            $columns[] = \is_array($meta) && isset($meta['name']) ? (string) $meta['name'] : (string) $i;
        }
        $rows = [];
        $truncated = false;
        while ($record = $statement->fetch()) {
            if (!\is_array($record)) {
                break;
            }
            if (\count($rows) >= 200) {
                $truncated = true;
                break;
            }
            $line = [];
            foreach ($columns as $column) {
                $line[] = $this->cell($record[$column] ?? null);
            }
            $rows[] = $line;
        }

        return [
            'columns' => $columns,
            'rows' => $rows,
            'affected' => $statement->rowCount(),
            'truncated' => $truncated,
        ];
    }

    private function cell(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        if (\is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (\is_int($value) || \is_float($value)) {
            return (string) $value;
        }
        if (!\is_string($value)) {
            return '';
        }
        $value = str_replace("\0", '', $value);

        return strlen($value) > 500 ? substr($value, 0, 500).'…' : $value;
    }

    private function message(\PDOException $error): string
    {
        $text = trim($error->getMessage());
        $text = preg_replace('/\s+/', ' ', $text) ?? '';
        if ('' === $text) {
            return 'Запрос не выполнен';
        }
        if (str_contains($text, 'could not find driver')) {
            return 'Драйвер PDO не установлен';
        }
        if (strlen($text) > 300) {
            $text = substr($text, 0, 300);
        }

        return $text;
    }
}
