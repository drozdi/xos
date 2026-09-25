# Идеи приложений XOS

> Бэклог продуктовых идей (2026-09-25). Не ТЗ: ориентиры для следующих consumer/CRUD apps.  
> Связано: [APPS.md](APPS.md) · [ROADMAP_WAVES.md](ROADMAP_WAVES.md) · PKB `Notes/AppIdeas.md`

Уже есть каркас: **Notes / Recipes** (IBlock consumer, view-first, share), CRUD list+detail (Device/Main/IBlock), Explorer viewers, Todo/Calendar/Board/PKB, SchoolTask, игры.

---

## 1. Как Notes / Recipes (IBlock consumer)

Быстрый путь: type `content` + новый block + apps `list`/`detail` по шаблону `notes`/`note`.

| App (идея) | Block code | Суть |
|------------|------------|------|
| Статьи / блог / новости | `articles` | рубрики, COVER, TAGS, markdown |
| FAQ / база ответов | `faq` | вопрос/ответ, категории |
| Галерея / альбомы | `gallery` | multiple images + подпись |
| События / анонсы | `events` | дата, место, COVER, markdown |
| Контакты / сотрудники | `contacts` | фото, должность, телефон |
| Прайс / услуги | `services` | цена, COVER, категории |
| Идеи / wishlist | `ideas` | статус, приоритет |
| notebooks | — | управление разделами notes (как `recipe-categories`) |

Дополнения к контенту: поиск по тегам, избранное, deep-link из PKB.

---

## 2. Как Device / Main / IBlock admin (list + detail CRUD)

| Идея | Аналог |
|------|--------|
| Склад / ТМЦ | device-devices |
| Автопарк (авто, ТО, документы) | device + files |
| Договоры / контрагенты | main-users style |
| Инвентаризация помещений | device-sub-devices |
| Каталог ПО / лицензий отдельно | device-licenses |

---

## 4. Как Todo / Calendar / Board / PKB

| Идея | Паттерн |
|------|---------|
| Привычки / трекер | todo + due |
| Inbox / почта (мини) | list + detail |
| Центр уведомлений | shell utility |
| Чеклисты встреч / связка задача↔событие | todo ↔ calendar (готово: share списка, `calendar_event_id`, deep-link) |
| Board вложения через AuthFileImage | board attachments + `file_id` |
| Deep-link IBlock из PKB | `[[note:12]]` / `[[recipe:5]]` |

---

## 5. Как SchoolTask

| Идея |
|------|
| Дневник оценок |
| Домашние задания |
| Родительский read-only share |

---

## 6. Как IncCom / TeamStorm

| Идея |
|------|
| Банк / счета (рядом с IncCom) |
| CRM-мини (лиды → IBlock) |
| Ещё один внешний API-клиент (как TeamStorm) |

---

## Приоритет (практика)

1. **Ещё 1–2 IBlock content-app** (статьи / FAQ / события) — максимум переиспользования `iblock-content`.  
2. **notebooks** для notes (категории блокнотов).  
3. Остальное — по ТЗ / волне 4 (`ROADMAP_WAVES.md`).

```bash
# обновить App Ideas в Board+PKB (без пересоздания):
php bin/console xos:seed-project
```
