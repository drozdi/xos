# ТЗ — база знаний

## 1. Назначение

Одна или несколько баз заметок. У vault есть владелец и участники. Заметки — файлы; связи `[[wikilink]]` считает индекс в БД.

## 2. Файлы

Дерево, чтение/запись содержимого, загрузка, папка, rename, delete. Пути относительны корня vault (не произвольный Explorer URI в API files). Префикс `/api/pkb/vaults/{id}/files`.

Корень по умолчанию: `home://Vaults/{slug}/`. При создании: `Notes/`, `Templates/`, `attachments/`, `.xos-vault/`.

## 3. Индекс vs файлы

| Задача | API |
|--------|-----|
| Читать/писать `.md` | `/files/content` |
| Список/поиск/граф/backlinks | `/notes`, `/search`, `/graph`, `/backlinks` |
| Пересборка | `POST /index/rebuild` |

Поиск Ctrl+K оболочки берёт первую доступную базу пользователя.

## 4. Участники и обмен

Приглашение, смена роли, удаление. Экспорт и `remote-sync`. Закладки: GET/PUT `/bookmarks`.

## 5. Связь с Board

Карточка хранит `pkb_vault_id` + `pkb_note_path`. Обратно только board API `cards/linked`. Seed кладёт продуктовую документацию в vault `xos` и линкует карточки roadmap.

## 6. Критерии

- [x] CRUD хранилища
- [x] Дерево и запись заметки
- [x] Поиск, граф, backlinks, rebuild
- [x] Участники, экспорт, закладки
- [x] Seed docs → vault + карточки Board
