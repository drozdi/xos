import { Modal, Spin } from 'antd';
import { useMemo } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { AppProvider } from '@/core/context/AppContext';
import { CoreApiProvider } from '@/core/context/CoreApiContext';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { useChildWindowStore } from './childWindowStore';
import { useWmStore } from './useWmStore';

interface ChildWindowPortalProps {
	windowId: string;
}

export function ChildWindowPortal({ windowId }: ChildWindowPortalProps) {
	const children = useChildWindowStore((state) => state.byParent[windowId] ?? []);

	if (children.length === 0) {
		return null;
	}

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
	const parentWindow = useWmStore((state) => state.windows[parentWindowId]);
	const manifest = parentWindow ? AppRegistry.get(parentWindow.appId) : undefined;
	const coreApi = useMemo(
		() =>
			parentWindow
				? getOrCreateCoreApi(parentWindowId, parentWindow.appId)
				: null,
		[parentWindow, parentWindowId],
	);
	const appContextValue = useMemo(
		() =>
			parentWindow && manifest
				? {
						appId: parentWindow.appId,
						windowId: parentWindowId,
						instanceKey: parentWindow.instanceKey,
						manifest,
					}
				: null,
		[manifest, parentWindow, parentWindowId],
	);

	const content =
		coreApi && appContextValue ? (
			<CoreApiProvider coreApi={coreApi}>
				<AppProvider value={appContextValue}>{child.content}</AppProvider>
			</CoreApiProvider>
		) : (
			child.content
		);

	return (
		<Modal
			open={child.open}
			onCancel={() => removeChild(parentWindowId, child.id)}
			title={child.title}
			footer={null}
			centered
			getContainer={false}
			zIndex={100}
			width={child.width}
			styles={{
				body: {
					height: child.height,
					overflow: 'auto',
					padding: 0,
				},
			}}
			style={{ maxWidth: '90%' }}
		>
			{content ?? <Spin size="small" />}
		</Modal>
	);
}
