import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonRemove, type ButtonRemoveProps } from './button-remove';

const meta = {
    title: 'Shared/ButtonRemove',
    component: ButtonRemove,
    tags: ['autodocs', 'test'],
    parameters: { layout: 'centered' },
    args: {
        tooltip: 'Удалить',
    },
} satisfies Meta<ButtonRemoveProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Subtle: Story = {
    args: {
        variant: 'subtle',
    },
};
