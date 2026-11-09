<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** One statement, without server-side file and program hooks. */
final class DbStatementGuard
{
    public static function assert(string $sql): string
    {
        $sql = trim($sql);
        if ('' === $sql || strlen($sql) > 8000 || str_contains($sql, "\0")) {
            throw new BadRequestHttpException('Запрос заполнен неверно');
        }
        if (str_ends_with($sql, ';')) {
            $sql = trim(substr($sql, 0, -1));
        }
        if ('' === $sql || str_contains($sql, ';')) {
            throw new BadRequestHttpException('Нужен один запрос');
        }
        if (1 === preg_match('/\b(outfile|dumpfile|load_file|load\s+data|lo_import|lo_export)\b/i', $sql)
            || 1 === preg_match('/\bcopy\b[\s\S]{0,200}\bprogram\b/i', $sql)) {
            throw new BadRequestHttpException('Запрос к файлам сервера недоступен');
        }

        return $sql;
    }
}
