import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseInbox } from '@/features/inbox/inboxAccess';

import { InboxIcon } from '../shared/AppIcons';

const InboxApp = lazy(() => import('./InboxApp'));

const manifest: AppManifest = {
	id: 'inbox',
	name: 'Inbox',
	version: '1.0.0',
	icon: InboxIcon,
	component: InboxApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	wmGroup: 'inbox',
	startMenuGroup: 'tools',
	taskbarGroup: 'inbox',
	requiredRole: 'inbox',
	canAccess: () => canUseInbox(),
	singleInstance: true,
};

export default manifest;
