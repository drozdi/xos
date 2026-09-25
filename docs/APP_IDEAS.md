# Идеи приложений и улучшений XOS

> Бэклог (2026-09-25). Не ТЗ — ориентиры для следующих apps и polish.  
> Связано: [APPS.md](APPS.md) · [ROADMAP_WAVES.md](ROADMAP_WAVES.md) · PKB `Notes/AppIdeas.md`

Уже есть: Notes/Recipes, CRUD Device/Main/IBlock, Explorer viewers, Todo/Calendar/Board/PKB, SchoolTask, игры, sticky/widgets.

---

## 1. Новые apps — IBlock consumer (как Notes/Recipes)

| App | Block code | Суть |
|-----|------------|------|
| Статьи / блог / новости | `articles` | рубрики, COVER, TAGS, markdown |
| FAQ / база ответов | `faq` | вопрос/ответ, категории |
| Галерея / альбомы | `gallery` | multiple images + подпись |
| События / анонсы | `events` | дата, место, COVER, markdown |
| Контакты / сотрудники | `contacts` | фото, должность, телефон |
| Прайс / услуги | `services` | цена, COVER, категории |
| Идеи / wishlist | `ideas` | статус, приоритет |
| notebooks | — | разделы notes (как `recipe-categories`) |

Дополнения: поиск по тегам, избранное.

---

## 2. Новые apps — CRUD list+detail (как Device/Main)

| Идея | Аналог |
|------|--------|
| Склад / ТМЦ | device-devices |
| Автопарк (авто, ТО, документы) | device + files |
| Договоры / контрагенты | main-users style |
| Инвентаризация помещений | device-sub-devices |
| Каталог ПО / лицензий отдельно | device-licenses |

---

## 3. Новые apps — SchoolTask / IncCom / TeamStorm

| Идея |
|------|
| Дневник оценок |
| Домашние задания |
| Родительский read-only share |
| Банк / счета (рядом с IncCom) |
| CRM-мини (лиды → IBlock) |
| Ещё один внешний API-клиент (как TeamStorm) |

---

## 4. Улучшения существующих модулей

| Область | Идея |
|---------|------|
| Todo ↔ Board | конвертация задачи в карточку / deep-link |
| Device ↔ IncCom | связь устройств с расходами |
| Todo | уведомления о due |
| Board | Mercure/SSE вместо polling; conflict UI |
| PKB | encryption at rest; plugin API; sync/publish |
| PKB | FULLTEXT search; ambiguous wikilink UX |
| Shell | центр уведомлений |
| Привычки / трекер | на базе todo + due |
| Inbox / почта (мини) | list + detail |

---

## 5. Платформа (волны 4–5)

| Идея |
|------|
| PWA / offline |
| Mobile layout |
| Audit UI |
| Multi-OU |

---

## Приоритет

1. **1–2 IBlock content-app** (статьи / FAQ / события) — максимум reuse `iblock-content`.
2. **notebooks** для notes.
3. Связки Todo↔Board, due notify, Device↔IncCom.
4. W3b (Mercure, PKB encryption/plugins) и платформа (PWA/mobile) — по отдельным планам.

```bash
# обновить App Ideas в Board+PKB (без пересоздания):
php bin/console xos:seed-project
```
