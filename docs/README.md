# Документация XOS

> Индекс monorepo · обновлено 2026-09-25

## Идеи и бэклог

| Документ | Назначение |
|----------|------------|
| [APP_IDEAS.md](APP_IDEAS.md) | Идеи новых приложений и улучшений |
| [ROADMAP_WAVES.md](ROADMAP_WAVES.md) | Очередь волн (W3b–W5) |

## Общие

| Документ | Назначение |
|----------|------------|
| [TZ.md](TZ.md) | Общее ТЗ (shell + модули) |
| [APPS.md](APPS.md) | Каталог desktop-приложений |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектура backend/frontend |
| [API_SPEC.md](API_SPEC.md) | REST API (сводная) |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Как добавить приложение |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Схема БД |
| [MIGRATIONS.md](MIGRATIONS.md) | Миграции Doctrine |

## Домены (ТЗ / обзор)

| Домен | ТЗ | Обзор | Доп. |
|-------|-----|-------|------|
| Система | [system/TZ.md](system/TZ.md) | [system/README.md](system/README.md) | — |
| Main | [main/TZ.md](main/TZ.md) | [main/README.md](main/README.md) | — |
| Device | [device/TZ.md](device/TZ.md) | [device/README.md](device/README.md) | — |
| Explorer | [explorer/TZ.md](explorer/TZ.md) | [explorer/README.md](explorer/README.md) | — |
| SchoolTask | [schooltask/TZ.md](schooltask/TZ.md) | [schooltask/README.md](schooltask/README.md) | — |
| IBlock | [iblock/TZ.md](iblock/TZ.md) | [iblock/README.md](iblock/README.md) | [API](iblock/API.md), [DEV](iblock/DEVELOPER_GUIDE.md) |
| IncCom | [inccom/TZ.md](inccom/TZ.md) | [inccom/README.md](inccom/README.md) | — |
| TeamStorm | — | [ts/README.md](ts/README.md) | — |
| Calendar | [calendar/TZ.md](calendar/TZ.md) | [calendar/README.md](calendar/README.md) | — |
| Todo | [todo/TZ.md](todo/TZ.md) | [todo/README.md](todo/README.md) | — |
| Board | [board/TZ.md](board/TZ.md) | [board/README.md](board/README.md) | — |
| PKB | [pkb/TZ.md](pkb/TZ.md) | [pkb/README.md](pkb/README.md) | [API](pkb/API_SPEC.md), [DEV](pkb/DEVELOPER_GUIDE.md) |

## Platform (shell)

| Документ | Назначение |
|----------|------------|
| [platform/README.md](platform/README.md) | Window manager, desktop-state, UX |
| [ADR-desktop-state-batch.md](ADR-desktop-state-batch.md) | ADR: snapshot рабочего стола |
| [ADR-desktop-ux-sync.md](ADR-desktop-ux-sync.md) | ADR: hydrate/debounce |
| [ADR-user-app-data.md](ADR-user-app-data.md) | ADR: user_app_data KV |
