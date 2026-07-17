import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { renderWithProviders } from '#dev/vitest/render';
import { DataColumn, TableData } from '../index';

interface DemoRow {
    id: number;
    name: string;
    amount: number;
}

const demoData: DemoRow[] = [
    { id: 1, name: 'Alpha', amount: 100 },
    { id: 2, name: 'Beta', amount: 200 },
];

describe('shared/ui/table/TableData', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('renders table rows from data', () => {
        renderWithProviders(
            <TableData<DemoRow>
                data={demoData}
                storage="unit-test-table"
                withPagination={false}
            >
                <DataColumn<DemoRow> field="name" header="Name" />
                <DataColumn<DemoRow> field="amount" header="Amount" align="right" />
            </TableData>,
        );

        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    test('renders empty state without data', () => {
        renderWithProviders(
            <TableData<DemoRow>
                data={[]}
                storage="unit-test-table-empty"
                withPagination={false}
            >
                <DataColumn<DemoRow> field="name" header="Name" />
            </TableData>,
        );

        expect(screen.getByText('No records')).toBeInTheDocument();
    });
});
