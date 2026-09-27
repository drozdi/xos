import { Box, Skeleton, Stack } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';

/** Shared chrome for desktop widgets (frame always visible, including Suspense). */
export const widgetSurfaceStyle: CSSProperties = {
	// Solid fill — no backdrop-filter (breaks paint inside Rnd transform until interaction).
	background: 'rgba(28, 34, 44, 0.94)',
	borderRadius: 14,
	border: '1px solid rgba(255, 255, 255, 0.22)',
	boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
	color: '#f5f7fa',
	overflow: 'hidden',
};

export function WidgetSkeleton({ compact = false }: { compact?: boolean }) {
	return (
		<Box
			h="100%"
			px={12}
			py={compact ? 8 : 12}
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
			}}
		>
			<Stack gap={compact ? 6 : 8}>
				<Skeleton height={10} width="42%" radius="sm" opacity={0.35} />
				<Skeleton height={compact ? 18 : 22} width="68%" radius="sm" opacity={0.45} />
				{compact ? null : <Skeleton height={10} width="55%" radius="sm" opacity={0.3} />}
			</Stack>
		</Box>
	);
}

export function WidgetBody({
	children,
	tint,
}: {
	children: ReactNode;
	tint?: string;
}) {
	return (
		<Box
			h="100%"
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				background: tint,
			}}
		>
			{children}
		</Box>
	);
}
