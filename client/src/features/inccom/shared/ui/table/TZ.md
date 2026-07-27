# Техническое задание: компонент TableData

**Версия:** 1.0  
**Модуль:** `src/shared/ui/table`  
**Стек:** React, TypeScript, Mantine UI  
**Связанные документы:** [README.md](./README.md), демо `src/pages/table.tsx`

---

## 1. Назначение

Универсальный компонент таблицы данных для личного кабинета (LK). Предназначен для отображения, фильтрации, сортировки, группировки и редактирования табличных данных с декларативным описанием колонок, persistence пользовательских настроек и поддержкой server-side pagination.

### 1.1. Цели

- Единый UI-компонент таблицы для всех разделов приложения
- Декларативное API через JSX (`DataColumn`) без дублирования разметки
- Гибкая группировка строк и колонок без смены компонента
- Сохранение пользовательских настроек (порядок, ширина, скрытие, сортировка, выбор)
- Расширяемость через контексты, кастомные layout/actions/pagination

### 1.2. Границы

**В scope:**

- Client-side: сортировка, группировка, пагинация по массиву
- Server-side: async fetcher с cursor pagination
- Inline-редактирование ячеек/строк
- Выбор строк и bulk-действия
- Группировка колонок (multi-row header)
- Split-field колонки (одна ячейка tbody, несколько подзаголовков)

**Out of scope (v1):**

- Виртуализация строк (windowing)
- Встроенная фильтрация колонок (есть заготовка `useTableFilter`, не интегрирована в `TableData`)
- Экспорт в Excel/CSV
- Закрепление колонок (sticky columns) — кроме служебных expander/select

---

## 2. Термины

| Термин | Определение |
|--------|-------------|
| **TableData** | Корневой компонент-оркестратор |
| **DataColumn** | Декларативное описание колонки (не рендерит DOM) |
| **ColumnEntity** | Runtime-модель колонки после сборки дерева |
| **TableNode** | Runtime-модель строки с метаданными группировки |
| **Group (строки)** | Раскрытие вложенного массива через nested `TableData` |
| **Grouped (строки)** | Объединение строк с одинаковым значением поля |
| **Группа колонок** | `DataColumn` с `header` без `field` и дочерними колонками |
| **Split-field** | `DataColumn` с `field` и header-only детьми; tbody — одна ячейка с `colSpan` |
| **Storage** | Persistence настроек (localStorage или custom backend) |

---

## 3. Функциональные требования

### 3.1. Отображение данных

| ID | Требование |
|----|------------|
| F-01 | Таблица отображает массив объектов `T[]` или загружает данные через async-fetcher |
| F-02 | Колонки задаются через `children: DataColumn[]` или prop `columns: ColumnEntity[]` |
| F-03 | Значение ячейки по умолчанию — `row[field]`; кастомный рендер через `body` |
| F-04 | Заголовок таблицы опционален (`withHeader`, по умолчанию `true`) |
| F-05 | Пустое состояние — компонент `TableEmpty` с настраиваемым текстом |
| F-06 | Состояние ошибки — `TableError`, таблица и empty не показываются одновременно |
| F-07 | Loading overlay через компонент `Loading` с `keepMounted` |
| F-08 | Таблица использует `layout="fixed"` (Mantine) для предсказуемых ширин |

### 3.2. Колонки

| ID | Требование |
|----|------------|
| C-01 | Поддержка выравнивания: `left`, `center`, `right` |
| C-02 | `ellipsis` / `noWrap` для обрезки длинного текста |
| C-03 | Начальная ширина через `width`; изменение через `resizable` |
| C-04 | Скрытие колонки через `toggleable` и иконку в заголовке |
| C-05 | Сортировка через `sortable` (иконка в заголовке) |
| C-06 | Перетаскивание порядка через `draggable` (иконка grip) |
| C-07 | Кастомные стили: `headerStyle`, `bodyStyle`, `rowStyle`, `footerStyle` |
| C-08 | Колонка `actions` — inline-панель или меню (`actionsMenu`) |
| C-09 | Служебные колонки: `select` (`__select__`), `hover_slot` (`__hover_slot__`), `actions` (`__actions__`) |

### 3.3. Группировка колонок (multi-row header)

| ID | Требование |
|----|------------|
| CG-01 | Родитель с `header` без `field` и `children` формирует группу колонок |
| CG-02 | Родительский заголовок: `rowspan=1`, `colspan` = число листовых дочерних колонок |
| CG-03 | Дочерние колонки отображаются на втором уровне заголовка |
| CG-04 | tbody строится из листовых колонок (`flattenBodyColumns`) |
| CG-05 | Перетаскивание группы — на корневом уровне (segment drag) |
| CG-06 | Перетаскивание внутри группы — только колонки с `field` |
| CG-07 | Сортировка по заголовку группы без `field` — по первому дочернему полю с `field` |
| CG-08 | Колонка `group` (expander) внутри группы колонок учитывает фиксированную ширину (~2.75rem) в header и body |

### 3.4. Split-field колонки

| ID | Требование |
|----|------------|
| SF-01 | Родитель: `field` + `header` + дочерние колонки только с `header` (без `field`) |
| SF-02 | Заголовок: родитель (colspan = число детей) + подзаголовки детей |
| SF-03 | tbody: **одна** ячейка со значением `field`, `colSpan` = число подзаголовков |
| SF-04 | Подзаголовки без `field` не участвуют в drag/sort tbody |
| SF-05 | Родитель split-field участвует в drag на корневом уровне как field/segment |

### 3.5. Группировка строк — `group`

| ID | Требование |
|----|------------|
| GR-01 | Колонка с `group` отображает expander при наличии непустого массива в `field` |
| GR-02 | Раскрытие рендерит вложенный `TableData` с данными из `field` |
| GR-03 | Ширина expander-колонки: CSS `--table-select-column-width` (default 2.75rem), переопределяется через `width` / resize |
| GR-04 | Строка-контейнер group: expander-cell + merged cell под nested table |
| GR-05 | Родительская строка group **не доступна** для inline-редактирования |
| GR-06 | Bulk expand/collapse group — через header expander (если есть expandable nodes) |
| GR-07 | Поиск колонки `group` рекурсивный (внутри групп колонок) |

### 3.6. Группировка строк — `grouped`

| ID | Требование |
|----|------------|
| GD-01 | Строки с одинаковым значением `field` объединяются: parent + `node.nodes` (siblings) |
| GD-02 | Expander в колонке текущего уровня группировки |
| GD-03 | Раскрытие grouped показывает дочерние строки inline или nested table (зависит от `groupLayout`) |
| GD-04 | Значение в grouped-колонке родителя отображается **жирным** при раскрытии |
| GD-05 | Padding nested grouped-строк: **1 шаг** (не кумулятивно по `groupLevel`) |
| GD-06 | `groupedHighlightLastRow`: подсветка только последней строки в expanded-блоке |

### 3.7. Мульти-группировка

| ID | Требование |
|----|------------|
| MG-01 | `groupKeys: (keyof T)[]` — порядок уровней группировки |
| MG-02 | Уровень 0: `groupBy` по `groupKeys[0]` |
| MG-03 | Раскрытие уровня N: nested table с `groupBy` по `groupKeys[N+1]` |
| MG-04 | Expander только в колонке, соответствующей активному ключу уровня |
| MG-05 | `multiGroup` (default `true` при `groupKeys.length > 1`): single/multiple expand |
| MG-06 | `initialGroupLevel` — стартовый индекс в `groupKeys` |
| MG-07 | `expandKey` уникален для вложенных grouped-узлов (`level:value/level:value/…`) |

### 3.8. Unified (`group` + `grouped` на одной колонке)

| ID | Требование |
|----|------------|
| UN-01 | `grouped` формирует `node.nodes` из siblings |
| UN-02 | `group` отображает `node.nodes` во вложенной таблице |
| UN-03 | `groupLayout: 'unified'` — expander и label в одной ячейке |
| UN-04 | Unified-строка-контейнер не редактируется |

### 3.9. Режимы `groupLayout`

| Значение | Поведение |
|----------|-----------|
| `default` | Только grouped, inline expand |
| `group-first` | group на верхнем уровне; grouped — во вложенной табtable |
| `grouped-first` | grouped на уровне; group — во вложенной таблице |
| `unified` | group + grouped на одной колонке |

Auto-detect: по наличию колонок `isGroup` / `isGrouped` (`resolveGroupLayout`).

### 3.10. Сортировка

| ID | Требование |
|----|------------|
| S-01 | Single-sort: desc → asc → сброс (цикл по клику) |
| S-02 | Multi-sort (`multiSort`): Shift+клик добавляет правило; бейдж приоритета |
| S-03 | Multi-sort цикл поля: add desc → toggle asc → remove |
| S-04 | Client-side: `sortByRules` после groupBy, перед limitBy |
| S-05 | Controlled: prop `sortRules` |
| S-06 | Persistence: `columns.sort` |
| S-07 | При удалении колонки правило сортировки автоматически удаляется |

### 3.11. Порядок и скрытие колонок

| ID | Требование |
|----|------------|
| O-01 | Drag field-колонок внутри одной `columnGroupKey` |
| O-02 | Drag segment (группа колонок) на корневом уровне |
| O-03 | Вложенные колонки: drag/sort **только** с `field` |
| O-04 | Persistence порядка полей: `columns.sorted` |
| O-05 | Persistence порядка сегментов: `columns.segments` |
| O-06 | Скрытие через toggler; persistence: `columns.hidden` |
| O-07 | HoverCard со списком toggleable-колонок в заголовке |
| O-08 | При изменении `columnsRaw` — синхронизация storage (merge + purge removed fields) |

### 3.12. Ширина колонок

| ID | Требование |
|----|------------|
| W-01 | Resize drag на правой границе заголовка (`resizable`) |
| W-02 | Во время drag — обновление DOM напрямую; commit в state на `mouseup` |
| W-03 | Resize соседней колонки при drag (если есть следующая resizable) |
| W-04 | Persistence: `columns.{field}.width` |
| W-05 | Group-only expander: default width без принудительного min 44px |

### 3.13. Выбор строк

| ID | Требование |
|----|------------|
| SEL-01 | Колонка checkbox: `selectable: 'start' \| 'end'` |
| SEL-02 | Header checkbox: select all / indeterminate |
| SEL-03 | Controlled: `selectedRows` / `onSelectedRowsChange` |
| SEL-04 | Persistence: `nodes.selected` (debounce 300ms) |
| SEL-05 | Selection context изолирован — строки не подписаны на selection |

### 3.14. Действия

| ID | Требование |
|----|------------|
| A-01 | `rowActions` — список действий с `hidden`/`disabled` predicates |
| A-02 | Отображение: колонка `actions`, hover-панель или оба |
| A-03 | `rowActionsOnHover` (default true без actions column) |
| A-04 | `bulkActions` — в header select/actions при выделении строк |
| A-05 | Кастомные panel-компоненты: `rowActionsPanel`, `bulkActionsPanel` |

### 3.15. Редактирование

| ID | Требование |
|----|------------|
| E-01 | `editMode: 'cell'` — активация по клику |
| E-02 | `editMode: 'row'` — активация по double-click |
| E-03 | Редактор через prop `editor` на `DataColumn` |
| E-04 | `updateNode` обновляет локальный `data`; `commitEdit` вызывает `onRowEditComplete` |
| E-05 | Group-container rows заблокированы для edit |
| E-06 | Edit context изолирован — перерисовка только затронутой строки |

### 3.16. Пагинация

| ID | Требование |
|----|------------|
| P-01 | Client-side: `limitBy(nodes, limit, page)` |
| P-02 | Server-side: fetcher `{ limit, page } => { data, next, total? }` |
| P-03 | Cursor navigation: history stack для «назад» |
| P-04 | Настраиваемые `limits`, смена limit сбрасывает page |
| P-05 | Кастомный компонент через prop `pagination` |

### 3.17. Persistence (Storage)

| ID | Требование |
|----|------------|
| ST-01 | Строковый ключ → localStorage с префиксом `{key}.` |
| ST-02 | Custom `TableStorage` interface для backend/session |
| ST-03 | `storage.clear()` — удаление всех ключей с префиксом |
| ST-04 | `purgeRemovedColumnStorage` — удаление width- ключей удалённых полей |
| ST-05 | Controlled props имеют приоритет над internal state |

**Ключи storage:**

```
{storage}.columns.sorted
{storage}.columns.segments
{storage}.columns.hidden
{storage}.columns.sort
{storage}.columns.{field}.width
{storage}.nodes.selected
```

### 3.18. Адаптивность

| ID | Требование |
|----|------------|
| R-01 | Prop `breakpoint` — при совпадении показывается `layout` (default: `SimpleGrid`) |
| R-02 | Prop `layout` — полная замена `<Table>` на кастомный рендер |

---

## 4. Модель данных

### 4.1. TableNode

```ts
interface TableNode<T> {
  data: T;
  index: string | number;
  isParent: boolean;      // grouped parent
  isChildren: boolean;    // grouped child (скрыт до expand)
  nodes: TableNode<T>[];  // siblings grouped / nested
  groupLevel?: number;    // индекс в groupKeys
  expandKey?: string;     // уникальный ключ expand state
}
```

### 4.2. ColumnEntity (runtime)

Собирается из `DataColumnProps` в `calculateColumn()`:

- Геометрия: `level`, `parentLevel`, `colspan`, `columnGroupKey`
- Флаги: `isGroup`, `isGrouped`, `isFieldSplit`, `isColumns`, `isHeader`, `isField`, …
- Behaviors: `isSorted`, `isToggleable`, `isDraggable`, `isResizable`

### 4.3. Pipeline данных

```
data: T[]
  → convertNodes(data, prevNodes?)     // TableNode[], structural sharing
  → groupByFirstKey (если groupKeys)   // верхний уровень grouped
  → limitBy (client pagination)
  → sortByRules
  → nodes[]                            // финальный список для render
```

### 4.4. Pipeline колонок

```
DataColumn[] / ColumnEntity[]
  → calculateColumn (дерево)
  → orderColumnsTree (columnOrder + segmentOrders)
  → buildDataColumns (раскладка group/grouped + groupAt)
  → inject select / actions / hover_slot
  → filter hiddenColumns
  → visibleColumns → flattenBodyColumns (tbody)
```

---

## 5. Архитектура

### 5.1. Компоненты

```
TableData
└── Providers (9 контекстов)
    └── Stack
        ├── Loading
        │   ├── TableError | TableEmpty | render()
        │   └── Table (default layout)
        │       ├── TableHeader
        │       └── TableBody
        │           └── TableBodyRow[]
        │               ├── TableBodyCell[]
        │               ├── TableBodyGrouped?
        │               └── TableBodyGroup?
        └── TablePagination?
```

### 5.2. Контексты

| Контекст | Ответственность |
|----------|-----------------|
| `TableSelectionContext` | selectedRows, toggle, selectAll |
| `TableExpandContext` | expands, isExpanded, toggleExpand |
| `TableGroupingContext` | groupKeys, groupLayout, groupAt, groupColumn |
| `TableColumnSizingContext` | columnWidths, resize, getColumnWidth |
| `TableSortContext` | sort, changeSort, multiSort |
| `TableColumnMetaContext` | order, hidden, drag sort |
| `TableEditContext` | editMode, editableIndex, updateNode |
| `TableRowActionsContext` | rowActions, bulkActions, hover |
| `TableDataContext` | nodes, props, colspan, rowspan, storage |

### 5.3. Хуки

| Хук | Назначение |
|-----|------------|
| `useColumnSort` | Сортировка + storage sync |
| `useColumnOrder` | Порядок полей и сегментов |
| `useColumnHidden` | Скрытые колонки |
| `useNodeSelect` | Выбор строк |
| `useTableFilter` | Фильтрация (не подключена к TableData) |

---

## 6. Нефункциональные требования

### 6.1. Производительность

| ID | Требование |
|----|------------|
| NF-01 | Разделение контекстов — изменение sort/edit/selection не вызывает полный re-render |
| NF-02 | `React.memo` на `TableBody`, `TableBodyRow`, `TableBodyCell`, `TableBodyCellSlot` |
| NF-03 | `convertNodes` — переиспользование `TableNode` при неизменных ссылках `data[i]` |
| NF-04 | Expand/selection lookup через `Set` — O(1) |
| NF-05 | Header JSX кэшируется в `useMemo` по `[columns, rowspan, colspan]` |
| NF-06 | Resize без context updates во время drag |

### 6.2. Доступность

| ID | Требование |
|----|------------|
| NF-10 | `role="row"`, `role="columnheader"` на заголовках |
| NF-11 | `aria-label` на expander, sorter, toggler, drager |
| NF-12 | Checkbox select all с indeterminate state |

### 6.3. Совместимость

| ID | Требование |
|----|------------|
| NF-20 | Generic `TableData<T>` / `DataColumn<T>` |
| NF-21 | Nested `TableData` в group/grouped без потери контекста родителя |
| NF-22 | Mantine `TableProps` пробрасываются через `props` |

---

## 7. UI-требования

### 7.1. Заголовок

- Двухуровневый при группировке/split-field колонок
- Иконки: sort (chevron), hide (X), drag (grip), resize (edge drag)
- Group/grouped header: expander bulk (если применимо)
- Select header: checkbox + bulk actions overlay

### 7.2. Тело

- Fixed layout, borders через Mantine `withColumnBorders`
- Group expander: класс `expanderCell`, фиксированная ширина
- Grouped padding: CSS custom property steps
- Hover row actions: overlay `hoverSlotOverlay`

### 7.3. CSS-переменные

```css
--table-select-column-width: 2.75rem;
--table-horizontal-spacing: 0.5rem;
```

---

## 8. API (сводка)

### TableData — обязательные

| Prop | Тип |
|------|-----|
| `data` | `T[]` \| fetcher |

### DataColumn — обязательные

| Prop | Тип |
|------|-----|
| `field` | `keyof T` (кроме header-only детей split-field) |

Полный список props — см. [README.md](./README.md) и `type.ts`.

---

## 9. Критерии приёмки

### 9.1. Базовая таблица

- [ ] Отображает данные с sortable/resizable/toggleable/draggable колонками
- [ ] Pagination client-side корректно ограничивает строки
- [ ] Empty и error states взаимоисключающие
- [ ] Storage восстанавливает настройки после reload

### 9.2. Группировка колонок

- [ ] Двухуровневый header с корректным colspan/rowspan
- [ ] Drag группы на корне; drag полей внутри группы
- [ ] Split-field: одна tbody-ячейка с colSpan
- [ ] Group expander column width учитывается в fixed layout

### 9.3. Группировка строк

- [ ] `group`: nested table при expand
- [ ] `grouped`: merge строк, expand siblings
- [ ] Multi-group: 3+ уровня с поэтапным раскрытием
- [ ] Unified: group+grouped на одной колонке
- [ ] Group container row не редактируется

### 9.4. Сортировка и edit

- [ ] Single и multi-sort с persistence
- [ ] Cell/row edit с `onRowEditComplete`
- [ ] Edit не ломает group expand state

### 9.5. Actions и selection

- [ ] Row actions: column, hover, menu
- [ ] Bulk actions при selection
- [ ] Select all / partial select

### 9.6. Async

- [ ] Fetcher pagination с next/prev cursor
- [ ] Loading/error states

### 9.7. Производительность

- [ ] Edit одной ячейки не re-render все строки
- [ ] Selection toggle не re-render все строки
- [ ] Sort не re-render edit-unrelated cells

---

## 10. Демо-сценарии (регрессия)

Страница `src/pages/table.tsx`:

| Вкладка | Проверяемые требования |
|---------|------------------------|
| Группировка колонок | CG-*, SF-* |
| Группа строк | GR-* |
| Мульти-группировка | MG-* |
| group + grouped | UN-* |
| Мульти-сортировка | S-* |
| Редактирование + group | E-*, GR-05 |
| Действия со строкой | A-* |
| Async fetch | P-02, F-01 |

---

## 11. Известные ограничения и backlog

| # | Описание | Приоритет |
|---|----------|-----------|
| B-01 | Нет виртуализации — все строки в DOM | Высокий для больших datasets |
| B-02 | `useTableFilter` не интегрирован | Средний |
| B-03 | Expand context broadcast — все expanders при toggle | Средний |
| B-04 | Resize re-render всех cell-wrap | Низкий |
| B-05 | `DataColumnsContext` — stub, не используется | Низкий |
| B-06 | Дублирование width logic (`use-column-width` vs `TableData`) | Низкий |

---

## 12. Структура модуля

```
src/shared/ui/table/
├── TableData.tsx       # Оркестратор
├── DataColumn.tsx      # Декларация колонки
├── type.ts             # Публичные типы
├── README.md           # Руководство разработчика
├── TZ.md               # Настоящее ТЗ
├── context/            # 9 React-контекстов
├── hooks/              # sort, order, hidden, select, filter
├── utils/              # group-by, column-fields, sort-by, …
└── ui/                 # Table, header, body, pagination, actions
```

---

*Документ отражает фактическую реализацию модуля на момент составления.*
