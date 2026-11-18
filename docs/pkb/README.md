# База знаний

Хранилище заметок (vault): дерево файлов в Explorer (`home://Vaults/{slug}/`), индекс wikilinks, поиск, граф, обратные ссылки, участники, экспорт, закладки.

Доступ: `ROLE_PKB`. Код: `server/src/Pkb`, `client/src/apps/pkb`, `client/src/features/pkb`.

## Сценарий

Открыть vault, писать markdown, связывать `[[Название]]`. Поиск и граф строятся по индексу. Участнику выдаётся роль. Экспорт — архив. Закладки — список путей пользователя.

Запись файла: `PUT /api/pkb/vaults/{id}/files/content` с `{ "path": "Notes/...", "content": "..." }`. После bulk-записи: `POST .../index/rebuild`. Статус: `GET .../index/status`.

Опционально: `encrypt_at_rest` + `PKB_AT_REST_SECRET`.

## Документация продукта в vault

`php bin/console xos:seed-project` зеркалирует репозиторий:

| Источник | Путь в vault |
|----------|----------------|
| `docs/README.md`, `TZ.md`, `API.md`, `DEVELOPER_GUIDE.md` | `Notes/Docs/` |
| `docs/APP_IDEAS.md` | `Notes/AppIdeas.md` |
| `docs/IMPROVEMENTS.md` | `Notes/Improvements.md` |
| `docs/<домен>/{README,TZ,API}.md` | `Notes/Apps/<Folder>/` |
| Хабы seed | `Notes/Home.md`, `Architecture.md`, `AppsCatalog.md`, модульные `Notes/Apps/*.md` |

Связанные карточки на доске «XOS — roadmap»: см. [board/README.md](../board/README.md). Deep-link окна: props `vaultId`, `notePath`.

См. [TZ.md](TZ.md), [API.md](API.md).
