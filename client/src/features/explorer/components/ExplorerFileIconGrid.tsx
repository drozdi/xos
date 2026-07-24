import { Typography } from 'antd';
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
		<div
			style={{
				padding: 12,
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
				gap: 8,
			}}
		>
			{rows.map(({ entry, path, index }) => {
				const isSelected = selected.includes(path);

				return (
					<button
						type="button"
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
							border: isSelected ? '1px solid #1677ff' : '1px solid transparent',
							background: isSelected ? 'rgba(22, 119, 255, 0.1)' : 'transparent',
							cursor: 'pointer',
						}}
					>
						<ExplorerEntryThumbnail entry={entry} path={path} size={72} />
						<Typography.Text
							style={{
								fontSize: 12,
								textAlign: 'center',
								width: '100%',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
							title={entry.name}
						>
							{isExplorerParentEntry(entry) ? '..' : entry.name}
						</Typography.Text>
					</button>
				);
			})}
		</div>
	);
}
