import { lazy, Suspense } from 'react';

import { useChildWindowStore } from './childWindowStore';

const ChildWindowPortal = lazy(() =>
	import('./ChildWindowPortal').then((module) => ({ default: module.ChildWindowPortal })),
);

export function ChildWindowPortalGate({ windowId }: { windowId: string }) {
	const hasChildren = useChildWindowStore(
		(state) => (state.byParent[windowId]?.length ?? 0) > 0,
	);

	if (!hasChildren) {
		return null;
	}

	return (
		<Suspense fallback={null}>
			<ChildWindowPortal windowId={windowId} />
		</Suspense>
	);
}
