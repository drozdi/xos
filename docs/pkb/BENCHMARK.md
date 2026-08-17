# PKB — Performance Benchmark

> Версия: 1.0 · Дата: 2026-08-17

## Цели (из PLAN.md)

| Метрика | Target |
|---------|--------|
| Full index rebuild @ 10k notes | **< 60 s** (background) |
| Vault-scoped search | **< 2 s** |
| Incremental index on save | **< 200 ms** |

## Методология

### 1. Подготовка fixture

Сгенерировать vault с N markdown-файлами (wikilinks, tags):

```bash
php docs/pkb/scripts/generate-vault-fixture.php 10000 ./var/pkb-fixture-10k
```

Зарегистрировать vault через PKB API (`POST /api/pkb/vaults`) с `rootPath: home://pkb-fixture-10k/` (или скопировать в `home://Vaults/bench/`).

### 2. Full rebuild benchmark

1. `POST /api/pkb/vaults/{id}/index/rebuild` — замер wall-clock от запроса до ответа.
2. Проверить `noteCount` в ответе = N.
3. Повторить 3 раза, взять медиану.

**Pass:** медиана < 60 s @ 10k notes.

### 3. Search benchmark

1. После rebuild: `GET /api/pkb/vaults/{id}/search?q=keyword-5000`.
2. Замер времени ответа (curl `-w '%{time_total}'` или PHPUnit/WebTest).
3. Повторить для 5 случайных запросов.

**Pass:** p95 < 2 s.

### 4. Incremental index (on save)

1. `PUT /api/pkb/vaults/{id}/files/content` для одной заметки.
2. Замер latency до ответа с полем `index`.

**Pass:** < 200 ms на dev hardware.

## Окружение

- PHP 8.2+, Symfony 7, MySQL/MariaDB (как prod)
- Отключить debug toolbar в benchmark runs
- Зафиксировать `noteCount`, версию индекса, hardware в отчёте

## Отчёт (шаблон)

| Run | noteCount | rebuild (s) | search p95 (s) | save index (ms) |
|-----|-----------|-------------|----------------|-----------------|
| 1   | 10000     | —           | —              | —               |

## Dev shortcut

Для локальной проверки pipeline без 10k файлов:

```bash
php docs/pkb/scripts/generate-vault-fixture.php 100
```

Затем rebuild + search через UI или API.
