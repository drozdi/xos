import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '#dev/vitest/render';
import { ButtonRemove } from '../button-remove';

describe('shared/ui/button/ButtonRemove', () => {
    test('renders remove button with default icon', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        renderWithProviders(
            <ButtonRemove aria-label="remove" onClick={onClick} />,
        );

        const button = screen.getByRole('button', { name: 'remove' });
        expect(button).toBeInTheDocument();

        await user.click(button);
        expect(onClick).toHaveBeenCalledOnce();
    });
});
