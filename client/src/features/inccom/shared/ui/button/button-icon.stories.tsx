import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingOutlined } from '@ant-design/icons';
import { ButtonIcon, type ButtonIconProps } from './button-icon';

const meta = {
    title: 'Shared/ButtonIcon',
    component: ButtonIcon,
    tags: ['autodocs', 'test'],
    parameters: { layout: 'centered' },
    args: {
        variant: 'filled',
        size: 'md',
        tooltip: 'Настройки',
    },
} satisfies Meta<ButtonIconProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (props) => (
        <ButtonIcon {...props}>
            <SettingOutlined />
        </ButtonIcon>
    ),
};

export const WithoutTooltip: Story = {
    args: { tooltip: undefined },
    render: (props) => (
        <ButtonIcon {...props}>
            <SettingOutlined />
        </ButtonIcon>
    ),
};
