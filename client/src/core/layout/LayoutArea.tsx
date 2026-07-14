import { Box, Text } from '@mantine/core';

import { ResizablePanel } from './ResizablePanel';
import { AREA_ID_TO_NAME } from './parseView';

type LayoutAreaId = keyof typeof AREA_ID_TO_NAME;

interface LayoutAreaProps {
	area: LayoutAreaId;
	children?: React.ReactNode;
}

export function LayoutArea({ area, children }: LayoutAreaProps) {
	const areaName = AREA_ID_TO_NAME[area];

	if (area === 'l' || area === 'r') {
		return (
			<ResizablePanel side={area === 'l' ? 'left' : 'right'} areaName={areaName}>
				{children ?? (
					<Text size="sm" c="dimmed">
						{area === 'l' ? 'Left panel' : 'Right panel'}
					</Text>
				)}
			</ResizablePanel>
		);
	}

	return (
		<Box
			style={{
				gridArea: areaName,
				position: 'relative',
				minHeight: 0,
				minWidth: 0,
				overflow: area === 'm' ? 'hidden' : undefined,
				backgroundColor:
					area === 'h'
						? 'var(--mantine-color-dark-7)'
						: area === 'f'
							? 'transparent'
							: undefined,
				borderBottom: area === 'h'
					? '1px solid var(--mantine-color-dark-5)'
					: undefined,
			}}
		>
			{children}
		</Box>
	);
}
