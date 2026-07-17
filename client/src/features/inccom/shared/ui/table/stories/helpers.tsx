import { Badge, Group, TextInput } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { TbPencil, TbTrash } from 'react-icons/tb';
import type { ColumnEntity, TableBulkAction, TableRowAction, TableRowActionsPanelProps } from '../type';
import { TableRowActionsPanel } from '../ui/row-actions/panel';
import {
    actionDemoData,
    cellEditSeed,
    editElementData,
    type ActionDemoRow,
    type CellEditRow,
    type EditElementRow,
} from './data';

export function StorySection({
    title,
    description,
    children,
}: {
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div style={{ width: '100%' }}>
            <h4 style={{ margin: '0 0 4px' }}>{title}</h4>
            {description ? (
                <p style={{ margin: '0 0 12px', color: 'var(--mantine-color-dimmed)', fontSize: 14 }}>
                    {description}
                </p>
            ) : null}
            {children}
        </div>
    );
}

export function DemoRowActionsPanel<T extends ActionDemoRow>({
    node,
    actions,
}: TableRowActionsPanelProps<T>) {
    return (
        <Group gap={6} wrap="nowrap">
            <Badge variant="light" size="sm">
                #{node.data.id}
            </Badge>
            <TableRowActionsPanel node={node} actions={actions} />
        </Group>
    );
}

export function editorCell(
    item: EditElementRow,
    column: ColumnEntity<EditElementRow>,
    onChange: (value: EditElementRow[keyof EditElementRow]) => void,
    onSave: () => void,
) {
    const field = column.field as keyof EditElementRow;
    return (
        <TextInput
            defaultValue={String(item[field] ?? '')}
            onChange={({ target }) => onChange(target.value as EditElementRow[keyof EditElementRow])}
            onKeyDown={({ key }) => {
                if (key === 'Enter') {
                    onSave();
                }
            }}
        />
    );
}

export function cellQtyEditor(
    item: CellEditRow,
    column: ColumnEntity<CellEditRow>,
    onChange: (value: CellEditRow[keyof CellEditRow]) => void,
    onSave: () => void,
) {
    const field = column.field as keyof CellEditRow;
    return (
        <TextInput
            type={field === 'qty' ? 'number' : 'text'}
            defaultValue={String(item[field] ?? '')}
            onChange={({ target }) => {
                const value = field === 'qty' ? Number(target.value) : target.value;
                onChange(value as CellEditRow[keyof CellEditRow]);
            }}
            onKeyDown={({ key }) => {
                if (key === 'Enter') {
                    onSave();
                }
            }}
        />
    );
}

export function useActionDemoState() {
    const [actionData, setActionData] = useState(actionDemoData);

    const createRowActions = useCallback(
        (
            onEdit: (item: ActionDemoRow, index: ActionDemoRow['id'] | string | number) => void,
        ): TableRowAction<ActionDemoRow>[] => [
            {
                id: 'edit',
                label: 'Редактировать',
                icon: <TbPencil size={16} />,
                onClick: (item, node) => onEdit(item, node.index),
            },
            {
                id: 'delete',
                label: 'Удалить',
                icon: <TbTrash size={16} />,
                color: 'red',
                onClick: (_, node) => {
                    setActionData((rows) => rows.filter((__, index) => index !== Number(node.index)));
                },
            },
        ],
        [],
    );

    const rowActions = useMemo(
        () =>
            createRowActions((item) => {
                const next = window.prompt('Имя', item.name);
                if (next == null) {
                    return;
                }
                setActionData((rows) =>
                    rows.map((row) => (row.id === item.id ? { ...row, name: next } : row)),
                );
            }),
        [createRowActions],
    );

    const bulkActions = useMemo<TableBulkAction<ActionDemoRow>[]>(
        () => [
            {
                id: 'delete-selected',
                label: 'Удалить выбранные',
                icon: <TbTrash size={16} />,
                color: 'red',
                onClick: ({ selectedIndexes }) => {
                    setActionData((rows) => rows.filter((_, index) => !selectedIndexes.includes(index)));
                },
            },
        ],
        [],
    );

    return { actionData, rowActions, bulkActions, setActionData };
}

export function useEditElementState() {
    const [data, setData] = useState(editElementData);
    return { data, setData };
}

export function useCellEditState() {
    const [data, setData] = useState(cellEditSeed);
    return { data, setData };
}
