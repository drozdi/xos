# Миграция UI: Mantine → Ant Design

**Статус:** выполнено (2026-07-24)  
**Цель:** в `client/package.json` не остаётся `@mantine/*`, `eslint-config-mantine`, `mantine-form-zod-resolver`, `postcss-preset-mantine`.

Связанные отчёты по этапам: [`docs/migration-reports/`](./migration-reports/) — все этапы 0–5 отмечены done.

## Контекст проекта (кратко)

| Часть | Стек |
|-------|------|
| Server | Symfony 7.3, Doctrine, JWT |
| Client | React 19, Vite 8, Tailwind 4, Zustand, TanStack Query |
| UI (до) | Mantine 9 |
| UI (после) | Ant Design 5+ |

Особенности клиента:

- Desktop-оболочка (окна, taskbar) и standalone-приложения (`/inccom`).
- Две авторизации: `/api/login` (login) и `/api/auth/login` (email).
- Списки сущностей через кастомный `DataTable` / IncCom `TableData` на Mantine.

## Принятые решения (defaults)

Если продукт-оунер не уточнил иное:

| Вопрос | Решение |
|--------|---------|
| `WeekCalendar` (`@mantine/schedule`) | Свой week-grid (Flex/CSS + dayjs), без FullCalendar |
| `DataTable` API | Facade: старые props → внутри `antd` `Table`, затем удаление legacy |
| `VirtualTable` | Оставить `react-window`, убрать Mantine-обёртку |
| Иконки | Пока `@tabler/icons-react`; точечно `@ant-design/icons` |

## Этапы

### Этап 0 — Подготовка
- Добавить `antd`, `@ant-design/icons`.
- `ConfigProvider` + `App` (antd) рядом/вместо провайдеров Mantine (переход).
- Локаль `ruRU`, тема (token).
- ESLint `no-restricted-imports` на новые `@mantine/*` (whitelist на время).
- Таблица маппинга props (см. ниже).

### Этап 1 — Инфраструктура ядра
- Notifications → `notification` / `message` / `App.useApp()`.
- Modals/confirm → `Modal.confirm`.
- Theme / color scheme → `ConfigProvider` algorithm.
- Dates → `DatePicker` (+ dayjs).
- Forms → `Form` + zod (убрать `@mantine/form`, `mantine-form-zod-resolver`).
- Hooks Mantine → локальные/antd.
- Убрать CSS `@mantine/*/styles.css` из `main.tsx`.

### Этап 2 — Shared UI + таблицы
- **Заменить `DataTable` / `TableData` на `antd` `Table`** (facade, затем снос Mantine-дерева).
- Перевести call-sites Main/Device/SchoolTask/IncCom lists.
- `VirtualTable`: без Mantine.
- Shared: loading, layout primitives где нужно.

### Этап 3 — Домены (остальной UI)
Порядок: Todo / games / settings → Main → Device → Explorer → SchoolTask (без календаря/RTE) → IncCom.

### Этап 4 — Сложные виджеты
- TipTap toolbar без `@mantine/tiptap`.
- `WeekCalendar` — свой grid.

### Этап 5 — Cleanup
- Удалить все mantine-зависимости и tooling.
- Проверки: `rg`, `npm ls`, `npm run build`, тесты.

## Маппинг props (кратко)

| Mantine | Ant Design |
|---------|------------|
| `Button` | `Button` |
| `TextInput` / `PasswordInput` | `Input` / `Input.Password` |
| `Textarea` | `Input.TextArea` |
| `Select` | `Select` |
| `Checkbox` / `Radio` | `Checkbox` / `Radio` |
| `Modal` | `Modal` |
| `Alert` | `Alert` |
| `Loader` | `Spin` |
| `Stack` / `Group` / `Box` | `Flex` / `Space` / `div` + Tailwind |
| `ActionIcon` | `Button type="text" icon={…}` |
| `notifications.show` | `notification.open` / `message.*` |
| `modals.openConfirmModal` | `Modal.confirm` |
| `DateTimePicker` | `DatePicker showTime` |
| `DataTable` columns API | facade → `Table` `columns`/`dataSource` |

## DataTable → Ant Table

1. Новый модуль `client/src/ui/data-table` (facade со старым API).
2. Перевод `@/components/table` потребителей.
3. Перевод IncCom `shared/ui/table` на общий модуль.
4. Удаление Mantine-реализаций.

## Критерий готовности

```bash
rg "@mantine|mantine-form|eslint-config-mantine|postcss-preset-mantine" client
# пусто

cd client && npm ls @mantine/core
# ошибка / empty

npm run build && npm test
```

## Отчёты

После каждого этапа файл:

`docs/migration-reports/stage-N-YYYY-MM-DD.md`

со списком изменённых/созданных/удалённых файлов и кратким итогом.
