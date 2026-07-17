import { Box, LoadingOverlay, type BoxProps } from '@mantine/core';

interface LoadingProps extends BoxProps {
	children: React.ReactNode;
	active?: boolean;
	keepMounted?: boolean;
	[key: string]: any;
}

export function Loading({ children, active, keepMounted, ...props }: LoadingProps) {
	const show = !active || keepMounted;
	return (
		<Box
			pos="relative"
			miw={active ? 300 : undefined}
			mih={active ? 300 : undefined}
			{...props}
		>
			<LoadingOverlay
				visible={active}
				zIndex={1000}
				overlayProps={{ radius: 'sm', blur: 2 }}
				loaderProps={{ color: 'pink', type: 'bars' }}
			/>
			{show && children}
		</Box>
	);
}
