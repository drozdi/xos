# TableData

Компонент таблицы данных с декларативным описанием колонок через `DataColumn`, поддержкой группировки строк и колонок, сортировки, редактирования, выбора строк и persistence в `localStorage`.

**Расположение:** `src/shared/ui/table`  
**Демо:** `src/pages/table.tsx` (роут с `TablePage`)

## Быстрый старт

```tsx
import { DataColumn, TableData } from '@/shared/ui/table';

interface Row {
  id: number;
  name: string;
  amount: number;
}

const data: Row[] = [
  { id: 1, name: 'Alpha', amount: 100 },
  { id: 2, name: 'Beta', amount: 200 },
];

<TableData<Row> data={data} storage="my-table" limit={50}>
  <DataColumn<Row> field="name" header="Название" sortable resizable />
  <DataColumn<Row> field="amount" header="Сумма" sortable align="right" />
</TableData>
```

## Основные компоненты

| Компонент | Назначение |
|-----------|------------|
| `TableData` | Оркестратор: данные, состояние, контексты, пагинация |
| `DataColumn` | Декларативное описание колонки (рендерит `null`, читается `TableData`) |
| `Table` | UI-обёртка Mantine (`layout="fixed"`) |
| `TablePagination` | Пагинация (можно заменить через prop `pagination`) |

Колонки задаются либо через `children` (`DataColumn`), либо через prop `columns: ColumnEntity[]`.

---

## TableData — props

### Данные

| Prop | Тип | Описание |
|------|-----|----------|
| `data` | `T[]` \| `fetcher` | Массив строк или async-функция `{ limit, page } => { data, next, total? }` |
| `total` | `number` | Общее число записей (для async) |
| `loading` | `boolean` | Внешний loading |
| `error` | `ReactNode` | Блок ошибки вместо таблицы |
| `noDataText` | `string` | Текст пустого состояния |

### Пагинация

| Prop | По умолчанию | Описание |
|------|--------------|----------|
| `withPagination` | `true` | Показывать пагинацию |
| `limit` | `15` | Размер страницы |
| `limits` | `[15, 30, 50, 75, 100]` | Варианты limit |
| `page` | `1` | Текущая страница |

### Колонки (controlled)

| Prop | Описание |
|------|----------|
| `columnOrder` / `onColumnOrder` | Порядок полей |
| `hiddenColumns` / `onToggleColumn` | Скрытые колонки |
| `columnWidths` / `onColumnResize` | Ширины колонок |

### Выбор строк

| Prop | Описание |
|------|----------|
| `selectable` | `'start'` \| `'end'` — колонка с чекбоксами |
| `selectedRows` / `onSelectedRowsChange` | Controlled-выбор |
| `bulkActions` | Массовые действия над выделенными строками |
| `bulkActionsPanel` | Кастомная панель bulk-действий |

### Действия со строкой

| Prop | Описание |
|------|----------|
| `rowActions` | Список действий (редактировать, удалить…) |
| `rowActionsPanel` | Кастомный рендер панели |
| `rowActionsOnHover` | Показывать при наведении (по умолчанию `true`, если нет колонки `actions`) |
| `rowActionsAt` | `'start'` \| `'end'` — позиция hover-панели |

### Группировка строк

| Prop | Описание |
|------|----------|
| `groupKeys` | Ключи группировки по порядку уровней: `['region', 'category']` |
| `groupAt` | `'start'` \| `'end'` — позиция expander в ячейке |
| `groupLayout` | `'default'` \| `'group-first'` \| `'grouped-first'` \| `'unified'` |
| `multiGroup` | Поэтапное раскрытие вложенных таблиц (по умолчанию `true` при `groupKeys.length > 1`) |
| `initialGroupLevel` | Стартовый уровень в `groupKeys` |
| `groupedHighlightLastRow` | Подсветка последней строки в grouped-блоке |

### Сортировка

| Prop | Описание |
|------|----------|
| `sortKey` / `sortDesc` | Начальная сортировка |
| `sortRules` | Controlled multi-sort |
| `multiSort` | Мульти-сортировка (по умолчанию `true` при нескольких `groupKeys`) |

### Редактирование

| Prop | Описание |
|------|----------|
| `editMode` | `'row'` \| `'cell'` |
| `onRowEditComplete` | Callback после сохранения строки |

### Прочее

| Prop | Описание |
|------|----------|
| `storage` | Строка-ключ или объект `TableStorage` для persistence |
| `withHeader` | Заголовок таблицы (`true`) |
| `breakpoint` | Адаптивный layout (альтернативный `layout`) |
| `layout` | Кастомный рендер вместо `<Table>` |
| `level` | Уровень вложенности (для nested `TableData`) |
| `minHeight` | Минимальная высота блока |

---

## DataColumn — props

| Prop | Описание |
|------|----------|
| `field` | Ключ поля в `T` |
| `header` | Заголовок (строка или render-функция) |
| `body` | Кастомный рендер ячейки `(item, column) => ReactNode` |
| `editor` | Inline-редактор `(item, column, onChange, onSave) => ReactNode` |
| `footer` | Footer колонки |
| `align` | `'left'` \| `'center'` \| `'right'` |
| `width` | Начальная ширина (px) |
| `sortable` | Сортировка по клику на заголовок |
| `toggleable` | Скрытие/показ колонки |
| `resizable` | Изменение ширины (drag на границе заголовка) |
| `draggable` | Перетаскивание для смены порядка |
| `ellipsis` / `noWrap` | Обрезка текста |
| `group` | Вложенная таблица из массива в `field` |
| `grouped` | Группировка строк по значению `field` |
| `actions` | Колонка действий (`rowActions` из `TableData`) |
| `actionsMenu` | Одна кнопка с меню вместо inline-панели |
| `actionsAt` | `'start'` \| `'end'` |
| `children` | Вложенные колонки (группа или split-field) |

---

## Группировка колонок

Заголовок без `field` объединяет дочерние колонки в двухуровневый header.

```tsx
<DataColumn header="Group" draggable sortable>
  <DataColumn group field="group" />
  <DataColumn field="position" header="Position" draggable />
  <DataColumn field="name" header="Name" draggable />
</DataColumn>
```

- **Заголовок:** родительский `Group` (colspan = число детей) + подзаголовки детей
- **tbody:** отдельные ячейки для каждого дочернего поля
- **Перетаскивание:** на корне — группа целиком; внутри группы — только колонки с `field`
- **Сортировка:** на группе без `field` — по первому дочернему полю

---

## Split-field (колонка с подзаголовками)

`DataColumn` с `field` и дочерними header-only колонками: в tbody **одна ячейка** с `colSpan`.

```tsx
<DataColumn field="symbol" header="Symbol" draggable sortable>
  <DataColumn header="Symbol 1" />
  <DataColumn header="Symbol 2" />
</DataColumn>
```

| | Группа колонок | Split-field |
|--|----------------|-------------|
| Родитель | `header` без `field` | `field` + `header` |
| tbody | отдельные ячейки у детей | одна ячейка, `colSpan = число подзаголовков |
| Подзаголовки | — | только отображение, без `field` |

---

## Группировка строк

### `group` — вложенная таблица

Колонка с массивом в `field`. При раскрытии — вложенный `TableData` с теми же (или урезанными) колонками.

```tsx
<DataColumn field="items" group header="Состав" />
```

- Expander в колонке `group` (фиксированная ширина ~2.75rem)
- Строка-контейнер group **не редактируется**
- Родительская строка при раскрытии: пустая ячейка на месте expander + merged cell под вложенную таблицу

### `grouped` — объединение строк

Строки с одинаковым значением поля объединяются; siblings хранятся в `node.nodes`.

```tsx
<DataColumn field="warehouse" grouped header="Склад" />
<DataColumn field="zone" grouped header="Зона" />
```

### Мульти-группировка

```tsx
<TableData
  data={rows}
  groupKeys={['region', 'category', 'status']}
>
  <DataColumn field="region" grouped header="Регион" />
  <DataColumn field="category" grouped header="Категория" />
  <DataColumn field="status" grouped header="Статус" />
  <DataColumn field="name" header="Название" sortable />
</TableData>
```

Поведение:
1. Уровень 0 — группировка по `groupKeys[0]`
2. Раскрытие — вложенная таблица с группировкой по `groupKeys[1]`
3. Expander только в колонке текущего уровня
4. Последний уровень — листовые строки

### `group` + `grouped` на одной колонке (unified)

```tsx
<DataColumn field="items" group grouped header="Комплектация" />
```

- `grouped` формирует `node.nodes`
- `group` показывает их во вложенной таблице

### Режимы `groupLayout`

| Значение | Описание |
|----------|----------|
| `default` | Только grouped, inline-раскрытие |
| `group-first` | Сначала group; внутри nested — grouped |
| `grouped-first` | Сначала grouped на уровне; group во вложенной таблице |
| `unified` | `group + grouped` на одной колонке |

---

## Сортировка

- Клик по иконке сортировки в заголовке: desc → asc → сброс
- `multiSort`: Shift+клик добавляет поле; бейдж показывает приоритет
- Сортировка применяется в pipeline после группировки и перед пагинацией (client-side)

---

## Порядок, скрытие и ширина колонок

| Действие | Prop | Persistence-ключ |
|----------|------|------------------|
| Порядок полей | `draggable` на `DataColumn` | `columns.sorted` |
| Порядок сегментов (группы) | `draggable` на группе | `columns.segments` |
| Скрытие | `toggleable` | `columns.hidden` |
| Ширина | `resizable` | `columns.{field}.width` |
| Сортировка | `sortable` | `columns.sort` |
| Выбор строк | `selectable` | `nodes.selected` |

При изменении набора колонок устаревшие ключи storage очищаются автоматически.

`storage.clear()` — удаляет все ключи с префиксом `{storageKey}.`.

---

## Persistence (localStorage)

При `storage="my-table"` ключи:

```
my-table.columns.sorted
my-table.columns.segments
my-table.columns.hidden
my-table.columns.sort
my-table.columns.{field}.width
my-table.nodes.selected
```

Можно передать свой объект `TableStorage` (например, для session/backend).

---

## Редактирование

```tsx
<TableData editMode="cell" onRowEditComplete={(item, index) => save(item)}>
  <DataColumn
    field="name"
    header="Имя"
    editor={(item, col, onChange, onSave) => (
      <TextInput
        value={item.name}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
      />
    )}
  />
</TableData>
```

| Режим | Активация |
|-------|-----------|
| `cell` | Клик по ячейке |
| `row` | Двойной клик по ячейке |

Строки-контейнеры `group` не редактируются.

---

## Async-данные

```tsx
<TableData
  data={({ limit, page }) => fetchPage({ limit, page })}
  withPagination
/>
```

Fetcher возвращает `{ data, next, total?, pages? }`. Пагинация использует cursor (`next`) и историю страниц.

---

## Архитектура

```
TableData
├── TableSelectionContext    — выбор строк
├── TableExpandContext       — раскрытие group / grouped
├── TableGroupingContext     — groupKeys, layout, expander position
├── TableColumnSizingContext — ширины, resize
├── TableSortContext         — sort, changeSort
├── TableColumnMetaContext   — порядок, скрытие, drag колонок
├── TableEditContext         — inline-редактирование
├── TableRowActionsContext   — row/bulk actions
└── TableDataContext         — nodes, props, colspan, rowspan
```

### Pipeline данных

```
data[] → convertNodes → groupBy (если groupKeys) → limitBy (page) → sortByRules → nodes[]
```

### Структура файлов

```
table/
├── TableData.tsx          # Оркестратор
├── DataColumn.tsx         # Декларация колонки
├── type.ts                # Типы
├── context/               # React-контексты
├── hooks/                 # sort, order, hidden, select
├── utils/                 # group-by, column-fields, sort-by…
└── ui/
    ├── Table.tsx
    ├── body/              # row, cell, group, grouped…
    └── header/            # header cells, sorter, resizer, drag
```

---

## Производительность

- Контексты разделены — изменение sort/edit/selection не перерисовывает всю таблицу
- `memo` на `TableBody`, `TableBodyRow`, `TableBodyCell`, `TableBodyCellSlot`
- `convertNodes` переиспользует `TableNode`, если элементы `data` не менялись по ссылке
- Resize обновляет DOM во время drag, state — на `mouseup`
- Selection/expand через `Set` для O(1) lookup

**Рекомендации:**
- Передавайте стабильные ссылки на `data` и Mantine-props
- Для 500+ строк рассмотрите виртуализацию (пока не встроена)

---

## Кастомизация

### Свой layout

```tsx
<TableData
  layout={({ nodes, columns }) => (
    <MyGrid nodes={nodes} columns={columns} />
  )}
  breakpoint="md"
/>
```

### Своя пагинация

```tsx
<TableData pagination={MyPagination} />
```

### Кастомные actions

```tsx
const rowActions: TableRowAction<Row>[] = [
  {
    id: 'edit',
    label: 'Изменить',
    onClick: (item) => openEdit(item),
  },
];

<TableData rowActions={rowActions} rowActionsPanel={MyActionsPanel} />
```

---

## Типы (основные)

```ts
interface TableNode<T> {
  data: T;
  index: string | number;
  isParent: boolean;
  isChildren: boolean;
  nodes: TableNode<T>[];
  groupLevel?: number;
  expandKey?: string;
}

interface SortRule<T> {
  key: keyof T;
  descending: boolean;
}
```

Полные типы — в `type.ts`.

---

## Связанные страницы демо

| Вкладка | Сценарий |
|---------|----------|
| Группировка колонок | Column groups + split-field |
| Группа строк | `group` expander |
| Мульти-группировка | 3 уровня `groupKeys` |
| group + grouped | Unified колонка |
| Мульти-сортировка | `multiSort`, Shift+клик |
| Редактирование + group | `editMode` |
| Действия со строкой | `rowActions`, bulk |
| Async fetch | Cursor pagination |
