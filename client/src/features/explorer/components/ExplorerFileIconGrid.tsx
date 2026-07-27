import { Box, Text, UnstyledButton } from '@mantine/core';
import type { MouseEvent } from 'react';

import type { ExplorerEntry } from '../explorerApi';
import { isExplorerParentEntry } from '../explorerPathUtils';

import { ExplorerEntryThumbnail } from './ExplorerEntryThumbnail';

interface ExplorerFileIconGridProps {
	rows: Array<{ entry: ExplorerEntry; path: string; index: number }>;
	selected: string[];
	onSelect: (path: string, index: number, event: MouseEvent) => void;
	onOpen: (entry: ExplorerEntry) => void | Promise<void>;
}

export function ExplorerFileIconGrid({ rows, selected, onSelect, onOpen }: ExplorerFileIconGridProps) {
	return (
		<Box
			p="sm"
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
				gap: 8,
			}}
		>
			{rows.map(({ entry, path, index }) => {
				const isSelected = selected.includes(path);

				return (
					<UnstyledButton
						key={path}
						onClick={(event) => onSelect(path, index, event)}
						onDoubleClick={() => void onOpen(entry)}
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 6,
							padding: 8,
							borderRadius: 8,
							border: isSelected
								? '1px solid var(--mantine-color-blue-5)'
								: '1px solid transparent',
							background: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
						}}
					>
						<ExplorerEntryThumbnail entry={entry} path={path} size={72} />
						<Text size="xs" ta="center" lineClamp={2} w="100%" title={entry.name}>
							{isExplorerParentEntry(entry) ? '..' : entry.name}
						</Text>
					</UnstyledButton>
				);
			})}
		</Box>
	);
}
