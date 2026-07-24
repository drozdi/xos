import { Skeleton } from 'antd';
import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '#dev/vitest/render';
import { Loading } from '../loading';

describe('shared/ui/loading/Loading', () => {
	test('renders children when inactive', () => {
		renderWithProviders(
			<Loading active={false}>
				<span>Loaded content</span>
			</Loading>,
		);

		expect(screen.getByText('Loaded content')).toBeInTheDocument();
	});

	test('shows overlay when active and keeps children mounted', () => {
		renderWithProviders(
			<Loading active keepMounted>
				<span>Loaded content</span>
			</Loading>,
		);

		expect(screen.getByText('Loaded content')).toBeInTheDocument();
		expect(document.querySelector('.xos-loading-overlay')).toBeTruthy();
		expect(document.querySelector('.ant-spin')).toBeTruthy();
	});

	test('renders skeleton instead of children when active with skeleton', () => {
		renderWithProviders(
			<Loading
				active
				skeleton={
					<div data-testid="skeleton">
						<Skeleton active paragraph={{ rows: 4 }} />
					</div>
				}
			>
				<span>Loaded content</span>
			</Loading>,
		);

		expect(screen.getByTestId('skeleton')).toBeInTheDocument();
		expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
	});
});
