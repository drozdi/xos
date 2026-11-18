# Доска

Пространства → доски → колонки → карточки: метки, чеклисты, комментарии, вложения, участники, поиск и живые обновления.

Доступ: `ROLE_BOARD`. Доска не режется активным подразделением Main. Код: `server/src/Board`, `client/src/apps/board`, `client/src/features/board`.

## Сценарий

Создать пространство и доску, колонки, карточку; перенести DnD; назначить исполнителей и метки; чеклист, комментарий, вложение. Карточку можно связать с заметкой PKB (`pkb_vault_id`, `pkb_note_path`). Обратный поиск: `GET /api/board/cards/linked?vault_id=&path=`.

Конфликт правки: тело с `expected_updated_at` → при устаревании **409**.

## Живое обновление

Если задан `MERCURE_PUBLIC_URL` (+ JWT secret), клиент подписывается на хаб (`GET .../realtime`). Иначе раз в ~5 с читает `GET /api/board/boards/{id}/events` и сравнивает метки времени. Рядом: `/changes`, `/activity`.

## Документация проекта на доске

Команда `php bin/console xos:seed-project` создаёт (или без `--force` синхронизирует) workspace **XOS**, доску **XOS — roadmap**, колонки «Обзор» / «Модули» / «Roadmap», метки и карточки со ссылками на vault `slug=xos`. Текст подробностей — в PKB; на карточке краткое `description_md` + линк.

См. [TZ.md](TZ.md), [API.md](API.md), [pkb/README.md](../pkb/README.md).
