# Миграции Doctrine

## Перед изменением схемы

```bash
cd server
php bin/console doctrine:schema:validate --skip-sync
```

Mapping и БД должны быть согласованы. Исправляйте mapping-ошибки до `migrations:diff`.

## Создание миграции

1. Проверить orphan-данные (FK, которые сломают ALTER).
2. `php bin/console doctrine:migrations:diff`
3. Просмотреть сгенерированный файл; добавить идемпотентные проверки при необходимости.
4. `php bin/console doctrine:migrations:migrate --dry-run`
5. `php bin/console doctrine:migrations:migrate`

## Правила для Device (`d_*`)

1. PK/FK — только `INT`, не `VARCHAR`.
2. Entity: `private ?int $id = null` (Doctrine ORM 3).
3. Перед FK — cleanup orphan-строк (`DELETE` с логированием в миграции).
4. Проверка существования constraint/index перед `addSql` на прод-подобных БД.

## Текущее состояние

- Базовая миграция: `migrations/Version20260720072214.php` (cleanup + приведение типов Device).
- CI запускает `doctrine:schema:validate --skip-sync` на каждый push/PR.

## Откат

```bash
php bin/console doctrine:migrations:migrate prev
```

На production — только после бэкапа и dry-run.
