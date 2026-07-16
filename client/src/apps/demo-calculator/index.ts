import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { getWindowApi } from '@/core/windowManager/windowApiRegistry';

import { CalculatorIcon } from './CalculatorIcon';

const CalculatorApp = lazy(() => import('./CalculatorApp'));

const manifest: AppManifest = {
	id: 'demo-calculator',
	name: 'Calculator',
	version: '1.0.0',
	icon: CalculatorIcon,
	component: CalculatorApp,
	defaultSize: { width: 320, height: 480 },
	minSize: { width: 280, height: 400 },
	wmGroup: 'tools',
	singleInstance: true,
	contextMenu: {
		window: (ctx) => [
			{
				id: 'clear-history',
				label: 'Clear history',
				onClick: () => {
					void ctx.windowId;
				},
			},
		],
		taskbar: (ctx) => [
			{
				id: 'open-settings',
				label: 'Calculator settings',
				onClick: () => {
					void ctx.windowId;
				},
			},
		],
		windowOverrides: {
			refresh: {
				id: 'refresh',
				label: 'Reset calculator',
				onClick: (ctx) => {
					if (!ctx.windowId) {return;}
					getWindowApi(ctx.windowId)?.refresh();
				},
			},
		},
	},
};

export default manifest;
