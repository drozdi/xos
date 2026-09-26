import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseGithub } from '@/features/github/githubAccess';

import { GithubIcon } from '../shared/AppIcons';

const GithubApp = lazy(() => import('./GithubApp'));

const manifest: AppManifest = {
	id: 'github',
	name: 'GitHub',
	version: '1.0.0',
	icon: GithubIcon,
	component: GithubApp,
	defaultSize: { width: 900, height: 700 },
	minSize: { width: 640, height: 480 },
	wmGroup: 'github',
	startMenuGroup: 'tools',
	taskbarGroup: 'github',
	requiredRole: 'github',
	canAccess: () => canUseGithub(),
	singleInstance: true,
};

export default manifest;
