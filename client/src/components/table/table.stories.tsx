import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { DataColumn, TableData } from './index';
import {
    actionDemoData,
    combinedData,
    elementGroupRows,
    multiGroupData,
    statusBadgeColor,
    type ActionDemoRow,
    type CellEditRow,
    type CombinedRow,
    type ElementGroupRow,
    type MultiGroupRow,
    type UnifiedRow,
    unifiedData,
} from './stories/data';
import {
    cellQtyEditor,
    DemoRowActionsPanel,
    editorCell,
    StorySection,
    useActionDemoState,
    useCellEditState,
    useEditElementState,
} from './stories/helpers';
import type { EditElementRow } from './stories/data';

const meta = {
    title: 'Shared/Table',
    tags: ['autodocs', 'test'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Демонстрации TableData — аналог страницы `pages/_ui/table`. Каждая story — отдельный сценарий API.',
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const tableWidth = { w: '100%' as const };

export const Basic: Story = {
    name: 'Базовая таблица',
    render: () => (
        <TableData<MultiGroupRow>
            data={multiGroupData.slice(0, 5)}
            storage="storybook.table.basic"
            withPagination={false}
            {...tableWidth}
        >
            <DataColumn<MultiGroupRow> field="name" header="Название" sortable resizable />
            <DataColumn<MultiGroupRow> field="amount" header="Сумма" sortable align="right" />
        </TableData>
    ),
};

export const GroupColumns: Story = {
    name: 'Группировка колонок',
    render: () => (
        <StorySection title="Групировка колонок">
            <TableData<ElementGroupRow>
                data={elementGroupRows}
                storage="storybook.table.group-columns"
                limit={50}
                withColumnBorders
                {...tableWidth}
            >
                <DataColumn<ElementGroupRow> field=".groupMeta" header="Group" align="center" draggable>
                    <DataColumn<ElementGroupRow> group field="group" />
                    <DataColumn<ElementGroupRow> draggable field="position" header="Element position" />
                    <DataColumn<ElementGroupRow> draggable field="name" header="Element name" />
                </DataColumn>
                <DataColumn<ElementGroupRow> field=".symbolMeta" header="Symbol" align="center" draggable>
                    <DataColumn<ElementGroupRow> field=".symbol1" header="Symbol 1" align="center" />
                    <DataColumn<ElementGroupRow> field=".symbol2" header="Symbol 2" align="center" />
                </DataColumn>
                <DataColumn<ElementGroupRow> draggable field="mass" header="Atomic mass" />
            </TableData>
        </StorySection>
    ),
};

export const GroupRows: Story = {
    name: 'Группа строк',
    render: () => (
        <StorySection
            title="Группа"
            description="Раскрывайте строки по полю group."
        >
            <TableData<ElementGroupRow>
                data={elementGroupRows}
                storage="storybook.table.group-rows"
                limit={50}
                {...tableWidth}
            >
                <DataColumn<ElementGroupRow> group field="group" />
                <DataColumn<ElementGroupRow> resizable draggable field="position" header="Element position" />
                <DataColumn<ElementGroupRow> draggable resizable field="name" header="Element name" />
                <DataColumn<ElementGroupRow> draggable resizable toggleable field="symbol" header="Symbol" />
                <DataColumn<ElementGroupRow> draggable resizable toggleable field="mass" header="Atomic mass" />
            </TableData>
        </StorySection>
    ),
};

export const MultiGrouped: Story = {
    name: 'Мульти-группировка',
    render: () => (
        <Stack gap="xl" w="100%">
            <StorySection
                title="3 уровня: region → category → status"
                description="Expander — в колонке текущего уровня."
            >
                <TableData<MultiGroupRow>
                    data={multiGroupData}
                    storage="storybook.table.multi-group"
                    limit={50}
                    {...tableWidth}
                >
                    <DataColumn<MultiGroupRow> field="region" grouped header="Регион" />
                    <DataColumn<MultiGroupRow> field="category" grouped header="Категория" />
                    <DataColumn<MultiGroupRow> field="status" grouped header="Статус" />
                    <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                    <DataColumn<MultiGroupRow> field="amount" header="Сумма" sortable align="right" />
                </TableData>
            </StorySection>

            <StorySection title="3 уровня с groupAt=&quot;end&quot;">
                <TableData<MultiGroupRow>
                    data={multiGroupData}
                    storage="storybook.table.multi-group-end"
                    limit={50}
                    groupAt="end"
                    {...tableWidth}
                >
                    <DataColumn<MultiGroupRow> field="region" grouped header="Регион" />
                    <DataColumn<MultiGroupRow> field="category" grouped header="Категория" />
                    <DataColumn<MultiGroupRow> field="status" grouped header="Статус" />
                    <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                    <DataColumn<MultiGroupRow> field="amount" header="Сумма" sortable align="right" />
                </TableData>
            </StorySection>
        </Stack>
    ),
};

export const GroupAndGrouped: Story = {
    name: 'group + grouped',
    render: () => (
        <Stack gap="xl" w="100%">
            <StorySection
                title="group + grouped — одна колонка"
                description="Колонка department — grouped и group на flat-массиве."
            >
                <TableData<UnifiedRow>
                    data={unifiedData}
                    groupAt="start"
                    storage="storybook.table.group-grouped-unified"
                    limit={50}
                    {...tableWidth}
                >
                    <DataColumn<UnifiedRow> field="department" group grouped header="Отдел" />
                    <DataColumn<UnifiedRow> field="employee" header="Сотрудник" sortable />
                    <DataColumn<UnifiedRow> field="role" header="Должность" />
                    <DataColumn<UnifiedRow> field="salary" header="Зарплата" sortable align="right" />
                </TableData>
            </StorySection>

            <StorySection title="group + grouped — разные колонки">
                <TableData<CombinedRow>
                    data={combinedData}
                    groupAt="start"
                    storage="storybook.table.group-grouped-combined"
                    limit={50}
                    {...tableWidth}
                >
                    <DataColumn<CombinedRow> field="items" group header="Комплектация" />
                    <DataColumn<CombinedRow> field="warehouse" grouped header="Склад" />
                    <DataColumn<CombinedRow> field="zone" grouped header="Зона" />
                    <DataColumn<CombinedRow> field="product" header="Товар" sortable />
                    <DataColumn<CombinedRow> field="sku" header="SKU" />
                    <DataColumn<CombinedRow> field="qty" header="Кол-во" sortable align="right" />
                </TableData>
            </StorySection>
        </Stack>
    ),
};

export const MultiSort: Story = {
    name: 'Мульти-сортировка',
    render: () => (
        <StorySection
            title="Мульти-сортировка"
            description="Shift+клик добавляет поле в цепочку сортировки."
        >
            <TableData<MultiGroupRow>
                data={multiGroupData}
                multiSort
                storage="storybook.table.multi-sort"
                limit={50}
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="region" header="Регион" sortable />
                <DataColumn<MultiGroupRow> field="category" header="Категория" sortable />
                <DataColumn<MultiGroupRow> field="status" header="Статус" sortable />
                <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" sortable align="right" />
            </TableData>
        </StorySection>
    ),
};

function RowEditDemo() {
    const { data, setData } = useEditElementState();

    return (
        <TableData<EditElementRow>
            data={data}
            editMode="row"
            breakpoint="sm"
            groupAt="start"
            storage="storybook.table.edit"
            onRowEditComplete={(item, index) => setData((rows) => rows.map((row, i) => (i === index ? item : row)))}
            {...tableWidth}
        >
            <DataColumn<EditElementRow> field="group" group header="" />
            <DataColumn<EditElementRow> resizable editor={editorCell} sortable field="position" header="Element position" />
            <DataColumn<EditElementRow> resizable editor={editorCell} sortable field="name" header="Element name" />
            <DataColumn<EditElementRow> resizable editor={editorCell} field="symbol" header="Symbol" />
            <DataColumn<EditElementRow> resizable editor={editorCell} field="mass" header="Atomic mass" />
        </TableData>
    );
}

export const RowEdit: Story = {
    name: 'Редактирование строк',
    render: () => (
        <StorySection title="Редактирование строк + nested group" description="Enter — сохранить ячейку.">
            <RowEditDemo />
        </StorySection>
    ),
};

function RowActionsHoverDemo() {
    const { actionData, rowActions, bulkActions } = useActionDemoState();

    return (
        <TableData<ActionDemoRow>
            data={actionData}
            rowActions={rowActions}
            bulkActions={bulkActions}
            rowActionsPanel={DemoRowActionsPanel}
            rowActionsAt="end"
            selectable="start"
            storage="storybook.table.row-actions-hover"
            limit={50}
            {...tableWidth}
        >
            <DataColumn<ActionDemoRow> field="name" header="Имя" sortable />
            <DataColumn<ActionDemoRow> field="role" header="Роль" />
        </TableData>
    );
}

function RowActionsColumnDemo() {
    const { actionData, rowActions, bulkActions } = useActionDemoState();

    return (
        <TableData<ActionDemoRow>
            data={actionData}
            rowActions={rowActions}
            bulkActions={bulkActions}
            rowActionsOnHover={false}
            selectable="start"
            storage="storybook.table.row-actions-column"
            limit={50}
            {...tableWidth}
        >
            <DataColumn<ActionDemoRow> field="name" header="Имя" sortable />
            <DataColumn<ActionDemoRow> field="role" header="Роль" />
            <DataColumn<ActionDemoRow> field="_actions" actions actionsAt="end" header="" width={88} />
        </TableData>
    );
}

function RowActionsMenuDemo() {
    const { actionData, rowActions, bulkActions } = useActionDemoState();

    return (
        <TableData<ActionDemoRow>
            data={actionData}
            rowActions={rowActions}
            bulkActions={bulkActions}
            rowActionsOnHover={false}
            selectable="start"
            storage="storybook.table.row-actions-menu"
            limit={50}
            {...tableWidth}
        >
            <DataColumn<ActionDemoRow> field="_actions" align="left" actions actionsMenu actionsAt="start" header="" width={48} />
            <DataColumn<ActionDemoRow> field="name" header="Имя" sortable />
            <DataColumn<ActionDemoRow> field="role" header="Роль" />
        </TableData>
    );
}

export const RowActions: Story = {
    name: 'Действия со строкой',
    render: () => (
        <Stack gap="xl" w="100%">
            <StorySection title="Hover-панель" description="Наведите на строку — справа появится панель.">
                <RowActionsHoverDemo />
            </StorySection>
            <StorySection title="Колонка действий (inline)">
                <RowActionsColumnDemo />
            </StorySection>
            <StorySection title="Колонка с меню">
                <RowActionsMenuDemo />
            </StorySection>
        </Stack>
    ),
};

export const CustomBody: Story = {
    name: 'Кастомный body',
    render: () => (
        <StorySection title="Кастомный body" description="DataColumn body — бейджи и форматирование.">
            <TableData<MultiGroupRow>
                data={multiGroupData.slice(0, 8)}
                storage="storybook.table.custom-body"
                limit={20}
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                <DataColumn<MultiGroupRow>
                    field="status"
                    header="Статус"
                    body={(item) => (
                        <Badge color={statusBadgeColor[item.status]} variant="light">
                            {item.status}
                        </Badge>
                    )}
                />
                <DataColumn<MultiGroupRow>
                    field="amount"
                    header="Сумма"
                    align="right"
                    body={(item) => <Text fw={600}>{item.amount.toLocaleString('ru-RU')} ₽</Text>}
                />
            </TableData>
        </StorySection>
    ),
};

export const ColumnFeatures: Story = {
    name: 'Колонки: resize, drag, toggle',
    render: () => (
        <StorySection title="Колонки: resize, drag, toggle">
            <TableData<MultiGroupRow>
                data={multiGroupData}
                storage="storybook.table.columns"
                limit={15}
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="region" header="Регион" sortable resizable draggable toggleable />
                <DataColumn<MultiGroupRow> field="category" header="Категория" sortable resizable draggable toggleable />
                <DataColumn<MultiGroupRow> field="name" header="Название" sortable resizable draggable />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" sortable resizable draggable toggleable align="right" />
            </TableData>
        </StorySection>
    ),
};

function ControlledSelectionDemo() {
    const [selected, setSelected] = useState<(string | number)[]>([]);

    return (
        <Stack gap="sm" w="100%">
            <Text size="sm">
                Выбрано индексов: {selected.length ? selected.join(', ') : '—'}
            </Text>
            <Group gap="xs">
                <Button size="xs" variant="light" onClick={() => setSelected([])}>
                    Сбросить
                </Button>
                <Button size="xs" variant="light" onClick={() => setSelected(actionDemoData.map((_, i) => i))}>
                    Выбрать все
                </Button>
            </Group>
            <TableData<ActionDemoRow>
                data={actionDemoData}
                selectable="start"
                selectedRows={selected}
                onSelectedRowsChange={setSelected}
                storage="storybook.table.controlled-select"
                limit={20}
                {...tableWidth}
            >
                <DataColumn<ActionDemoRow> field="name" header="Имя" />
                <DataColumn<ActionDemoRow> field="role" header="Роль" />
            </TableData>
        </Stack>
    );
}

export const ControlledSelection: Story = {
    name: 'Controlled selection',
    render: () => (
        <StorySection title="Controlled selection">
            <ControlledSelectionDemo />
        </StorySection>
    ),
};

export const SelectableEnd: Story = {
    name: 'Выделение справа',
    render: () => (
        <StorySection title="selectable=&quot;end&quot;">
            <TableData<ActionDemoRow>
                data={actionDemoData}
                selectable="end"
                storage="storybook.table.select-end"
                limit={20}
                {...tableWidth}
            >
                <DataColumn<ActionDemoRow> field="name" header="Имя" />
                <DataColumn<ActionDemoRow> field="role" header="Роль" />
            </TableData>
        </StorySection>
    ),
};

function CellEditDemo() {
    const { data, setData } = useCellEditState();

    return (
        <TableData<CellEditRow>
            data={data}
            editMode="cell"
            storage="storybook.table.cell-edit"
            onRowEditComplete={(item, index) => setData((rows) => rows.map((row, i) => (i === index ? item : row)))}
            {...tableWidth}
        >
            <DataColumn<CellEditRow> field="name" header="Наименование" editor={cellQtyEditor} />
            <DataColumn<CellEditRow> field="qty" header="Кол-во" align="right" editor={cellQtyEditor} />
        </TableData>
    );
}

export const CellEdit: Story = {
    name: 'editMode: cell',
    render: () => (
        <StorySection title="editMode: cell" description="Клик по ячейке с editor — редактирование. Enter — сохранить.">
            <CellEditDemo />
        </StorySection>
    ),
};

export const WithPagination: Story = {
    name: 'Локальная пагинация',
    render: () => (
        <StorySection title="Локальная пагинация">
            <TableData<MultiGroupRow>
                data={multiGroupData}
                limit={5}
                limits={[5, 10, 20]}
                storage="storybook.table.pagination"
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="region" header="Регион" sortable />
                <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" align="right" sortable />
            </TableData>
        </StorySection>
    ),
};

export const GroupAtEnd: Story = {
    name: 'groupAt: end',
    render: () => (
        <StorySection title="groupAt: end">
            <TableData<MultiGroupRow>
                data={multiGroupData.slice(0, 10)}
                groupAt="end"
                storage="storybook.table.group-at-end"
                limit={20}
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="region" grouped header="Регион" />
                <DataColumn<MultiGroupRow> field="category" grouped header="Категория" />
                <DataColumn<MultiGroupRow> field="name" header="Название" />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" align="right" />
            </TableData>
        </StorySection>
    ),
};

function RowActionsStartDemo() {
    const { actionData, rowActions } = useActionDemoState();

    return (
        <TableData<ActionDemoRow>
            data={actionData}
            rowActions={rowActions}
            rowActionsAt="start"
            storage="storybook.table.hover-start"
            limit={20}
            {...tableWidth}
        >
            <DataColumn<ActionDemoRow> field="name" header="Имя" />
            <DataColumn<ActionDemoRow> field="role" header="Роль" />
        </TableData>
    );
}

export const RowActionsAtStart: Story = {
    name: 'Hover-панель слева',
    render: () => (
        <StorySection title="rowActionsAt=&quot;start&quot;">
            <RowActionsStartDemo />
        </StorySection>
    ),
};

function StatesDemo() {
    const [state, setState] = useState<'empty' | 'loading' | 'error'>('empty');

    return (
        <Stack gap="sm" w="100%">
            <Group gap="xs">
                <Button size="xs" variant={state === 'empty' ? 'filled' : 'light'} onClick={() => setState('empty')}>
                    empty
                </Button>
                <Button size="xs" variant={state === 'loading' ? 'filled' : 'light'} onClick={() => setState('loading')}>
                    loading
                </Button>
                <Button size="xs" variant={state === 'error' ? 'filled' : 'light'} color="red" onClick={() => setState('error')}>
                    error
                </Button>
            </Group>
            <TableData<MultiGroupRow>
                data={[]}
                loading={state === 'loading'}
                error={state === 'error' ? 'Не удалось загрузить данные' : undefined}
                noDataText="Нет записей для отображения"
                withPagination={false}
                storage="storybook.table.states"
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="name" header="Название" />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" />
            </TableData>
        </Stack>
    );
}

export const States: Story = {
    name: 'Состояния: empty, loading, error',
    render: () => (
        <StorySection title="Состояния">
            <StatesDemo />
        </StorySection>
    ),
};

export const Breakpoint: Story = {
    name: 'Breakpoint — карточки',
    render: () => (
        <StorySection
            title="Breakpoint — карточки"
            description="На узком экране таблица переключается в layout карточек."
        >
            <TableData<UnifiedRow>
                data={unifiedData}
                breakpoint="md"
                storage="storybook.table.breakpoint"
                limit={20}
                {...tableWidth}
            >
                <DataColumn<UnifiedRow> field="department" header="Отдел" />
                <DataColumn<UnifiedRow> field="employee" header="Сотрудник" />
                <DataColumn<UnifiedRow> field="salary" header="Зарплата" align="right" />
            </TableData>
        </StorySection>
    ),
};

export const Loading: Story = {
    name: 'Loading',
    render: () => (
        <TableData<MultiGroupRow>
            data={[]}
            loading
            storage="storybook.table.loading"
            withPagination={false}
            {...tableWidth}
        >
            <DataColumn<MultiGroupRow> field="name" header="Название" />
            <DataColumn<MultiGroupRow> field="amount" header="Сумма" />
        </TableData>
    ),
};

function AsyncFetchDemo() {
    const fetcher = useMemo(
        () =>
            async (input?: { limit: number; page: string | number }) => {
                const limit = input?.limit ?? 5;
                const page = input?.page ?? 0;
                await new Promise((resolve) => setTimeout(resolve, 400));
                const offset = Number(page) || 0;
                const slice = multiGroupData.slice(offset, offset + limit);
                const next = offset + limit;

                return {
                    data: slice,
                    next: next < multiGroupData.length ? next : '',
                    total: multiGroupData.length,
                };
            },
        [],
    );

    return (
        <StorySection title="Cursor pagination (fetcher)">
            <TableData<MultiGroupRow>
                storage="storybook.table.fetch"
                data={fetcher}
                limit={5}
                limits={[5, 10]}
                {...tableWidth}
            >
                <DataColumn<MultiGroupRow> field="region" header="Регион" sortable />
                <DataColumn<MultiGroupRow> field="name" header="Название" sortable />
                <DataColumn<MultiGroupRow> field="amount" header="Сумма" align="right" sortable />
            </TableData>
        </StorySection>
    );
}

export const AsyncFetch: Story = {
    name: 'Async fetch',
    render: () => <AsyncFetchDemo />,
};
