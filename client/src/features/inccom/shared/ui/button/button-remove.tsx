import { memo } from "react";
import { TbCircleX } from "react-icons/tb";
import { ButtonIcon, type ButtonIconProps } from "./button-icon";

export interface ButtonRemoveProps extends ButtonIconProps {}

const DEFAULT_ICON = <TbCircleX />;

function ButtonRemoveRoot({
	children = DEFAULT_ICON,
	...props
}: ButtonRemoveProps) {
	return (
		<ButtonIcon color="red" {...props}>
			{children}
		</ButtonIcon>
	);
}

export const ButtonRemove = memo(ButtonRemoveRoot);
