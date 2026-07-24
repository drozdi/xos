import { memo } from "react";
import { CloseCircleOutlined } from "@ant-design/icons";
import { ButtonIcon, type ButtonIconProps } from "./button-icon";

export interface ButtonRemoveProps extends ButtonIconProps {}

const DEFAULT_ICON = <CloseCircleOutlined />;

function ButtonRemoveRoot({
	children = DEFAULT_ICON,
	...props
}: ButtonRemoveProps) {
	return (
		<ButtonIcon danger {...props}>
			{children}
		</ButtonIcon>
	);
}

export const ButtonRemove = memo(ButtonRemoveRoot);
