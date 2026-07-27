import { ActionIcon, type ActionIconProps, Tooltip } from "@mantine/core";
import { memo } from "react";

export interface ButtonIconProps extends ActionIconProps {
	tooltip?: string;
	onClick?: () => void;
}

function ButtonIconRoot({ children, tooltip, ...props }: ButtonIconProps) {
	return (
		<Tooltip disabled={!tooltip} label={tooltip}>
			<ActionIcon {...props}>
				{children}
			</ActionIcon>
		</Tooltip>
	);
}

export const ButtonIcon = memo(ButtonIconRoot);
