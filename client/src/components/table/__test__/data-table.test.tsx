import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '#dev/vitest/render';

import { DataTable } from '../DataTable';

interface DemoRow {
	id: number;
	name: string;
}

const demoData: DemoRow[] = [
	{ id: 1, name: 'Alpha' },
	{ id: 2, name: 'Beta' },
];

describe('DataTable', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('renders rows and columns', () => {
		renderWithProviders(
			<DataTable
				storageKey="data-table-test"
				columns={[{ field: 'name', header: 'Name' }]}
				data={demoData}
			/>,
		);

		expect(screen.getByText('Alpha')).toBeInTheDocument();
		expect(screen.getByText('Name')).toBeInTheDocument();
	});

	it('calls onRowClick when row cell is clicked', async () => {
		const user = userEvent.setup();
		const onRowClick = vi.fn();

		renderWithProviders(
			<DataTable
				storageKey="data-table-click-test"
				columns={[{ field: 'name', header: 'Name' }]}
				data={demoData}
				onRowClick={onRowClick}
			/>,
		);

		await user.click(screen.getByText('Beta'));
		expect(onRowClick).toHaveBeenCalledWith(demoData[1]);
	});
});
