import { Title as MantineTitle, type TitleProps } from '@mantine/core';

export function Title({ children, ...props }: TitleProps) {
	if (children) {
		return <MantineTitle {...props}>{children}</MantineTitle>;
	}
	return '';
}
