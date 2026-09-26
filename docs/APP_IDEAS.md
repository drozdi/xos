# Идеи приложений и улучшений XOS

> Открытый бэклог. Не ТЗ.  
> Каталог уже сделанного: [APPS.md](APPS.md) · волны: [ROADMAP_WAVES.md](ROADMAP_WAVES.md)

---

## Новые apps

| Идея | Паттерн |
|------|---------|
| Дневник оценок | SchoolTask |
| Домашние задания | SchoolTask |
| Родительский read-only share | SchoolTask |
| Банк / счета | IncCom |
| CRM-мини (лиды) | IBlock consumer |
| Ещё один внешний API-клиент | TeamStorm-like |
| Привычки / трекер | Todo + due |
| Inbox / почта (мини) | list + detail |

Дополнения к IBlock content: поиск по тегам, избранное.

---

## Улучшения модулей / платформы

| Область | Идея |
|---------|------|
| Board | Mercure/SSE вместо polling; conflict UI (**W3b**) |
| PKB | encryption at rest; plugin API; sync/publish (**W3b**) |
| PKB | FULLTEXT search; ambiguous wikilink UX |
| Multi-OU | полноценный tenancy (сейчас только фильтр списка) |
| PWA | offline data / API cache (сейчас shell + SW) |

---

## Приоритет

1. **W3b** — Mercure, PKB encryption/plugins  
2. SchoolTask / IncCom apps из таблицы выше  
3. Привычки / Inbox  

```bash
php bin/console xos:seed-project
```
