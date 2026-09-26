import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseInbox } from '@/features/inbox/inboxAccess';

import { InboxIcon } from '../shared/AppIcons';

const InboxMessageApp = lazy(() => import('./InboxMessageApp'));

const manifest: AppManifest = {
	id: 'inbox-message',
	name: 'Сообщение',
	version: '1.0.0',
	icon: InboxIcon,
	component: InboxMessageApp,
	defaultSize: { width: 640, height: 560 },
	minSize: { width: 420, height: 360 },
	instanceKey: (params) => String(params?.instanceKey ?? params?.props?.id ?? '0'),
	singleInstance: false,
	wmGroup: 'inbox-message',
	wmSort: 2,
	startMenu: false,
	taskbarGroup: 'inbox',
	requiredRole: 'inbox',
	canAccess: () => canUseInbox(),
};

export default manifest;
