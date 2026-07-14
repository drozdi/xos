import { Box, Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';

import { useChildWindowStore } from './childWindowStore';

const LazyModal = lazy(() =>
	import('@mantine/core').then((module) => ({ default: module.Modal })),
);

interface ChildWindowPortalProps {
	windowId: string;
}

export function ChildWindowPortal({ windowId }: ChildWindowPortalProps) {
	const children = useChildWindowStore((state) => state.byParent[windowId] ?? []);

	if (children.length === 0) {return null;}

	return (
		<>
			{children.map((child) => (
				<ChildWindowDialog key={child.id} parentWindowId={windowId} child={child} />
			))}
		</>
	);
}

interface ChildWindowDialogProps {
	parentWindowId: string;
	child: {
		id: string;
		title: string;
		width: number;
		height: number;
		content: React.ReactNode;
		open: boolean;
	};
}

function ChildWindowDialog({ parentWindowId, child }: ChildWindowDialogProps) {
	const removeChild = useChildWindowStore((state) => state.removeChild);

	return (
		<Suspense fallback={<Loader size="xs" />}>
			<LazyModal
				opened={child.open}
				onClose={() => removeChild(parentWindowId, child.id)}
				title={child.title}
				size="auto"
				centered
				withinPortal={false}
				zIndex={100}
				styles={{
					inner: { position: 'absolute', inset: 0, padding: 0 },
					content: {
						width: child.width,
						maxWidth: '90%',
						maxHeight: '90%',
					},
					body: {
						height: child.height,
						overflow: 'auto',
					},
				}}
			>
				<Box>{child.content}</Box>
			</LazyModal>
		</Suspense>
	);
}
