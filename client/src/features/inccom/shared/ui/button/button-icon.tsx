import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import { memo, type ReactNode } from 'react';

export interface ButtonIconProps extends Omit<ButtonProps, 'children'> {
	tooltip?: string;
	children?: ReactNode;
	onClick?: () => void;
}

function ButtonIconRoot({ children, tooltip, ...props }: ButtonIconProps) {
	const button = (
		<Button type="text" {...props}>
			{children}
		</Button>
	);
	if (!tooltip) {
		return button;
	}
	return <Tooltip title={tooltip}>{button}</Tooltip>;
}

export const ButtonIcon = memo(ButtonIconRoot);
