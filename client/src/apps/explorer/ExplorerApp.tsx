import { ExplorerWorkspace } from '@/features/explorer/ExplorerWorkspace';

export default function ExplorerApp() {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<ExplorerWorkspace />
		</div>
	);
}
