import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

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
};

export default manifest;
