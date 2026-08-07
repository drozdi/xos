import { Box } from '@mantine/core';

import { ExplorerWorkspace } from '@/features/explorer/ExplorerWorkspace';

export default function ExplorerOpenPickerApp() {
	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<ExplorerWorkspace pickerMode="open" />
		</Box>
	);
}
