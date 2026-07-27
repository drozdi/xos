import { Skeleton } from '@mantine/core';
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
        expect(document.querySelector('.mantine-LoadingOverlay-root')).toBeTruthy();
    });

    test('renders skeleton instead of children when active with skeleton', () => {
        renderWithProviders(
            <Loading active skeleton={<Skeleton data-testid="skeleton" h={120} />}>
                <span>Loaded content</span>
            </Loading>,
        );

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
        expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
    });
});
