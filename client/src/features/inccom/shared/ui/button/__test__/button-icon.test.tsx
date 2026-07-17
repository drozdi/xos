import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '#dev/vitest/render';
import { ButtonIcon } from '../button-icon';

describe('shared/ui/button/ButtonIcon', () => {
    test('renders action icon and handles click', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        renderWithProviders(
            <ButtonIcon aria-label="settings" onClick={onClick}>
                <span data-testid="icon" />
            </ButtonIcon>,
        );

        await user.click(screen.getByRole('button', { name: 'settings' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    test('shows tooltip label', async () => {
        const user = userEvent.setup();

        renderWithProviders(
            <ButtonIcon tooltip="Настройки" aria-label="settings">
                <span />
            </ButtonIcon>,
        );

        await user.hover(screen.getByRole('button', { name: 'settings' }));
        expect(await screen.findByText('Настройки')).toBeInTheDocument();
    });
});
