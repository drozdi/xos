import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadMainAudit } from '@/features/main/mainAccess';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { AuditIcon } from '../shared/AppIcons';

const MainAuditApp = lazy(() => import('./MainAuditApp'));

const manifest: AppManifest = {
	id: 'main-audit',
	name: 'Аудит',
	version: '1.0.0',
	icon: AuditIcon,
	component: MainAuditApp,
	defaultSize: { width: 900, height: 560 },
	minSize: { width: 640, height: 360 },
	...createMainListManifestOptions('main-audit', 50),
	canAccess: canReadMainAudit,
};

export default manifest;
