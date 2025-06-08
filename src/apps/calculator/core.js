import { lazy } from 'react';
import { appManager } from '../../core/app-system/app-manager';

appManager.register('apps/calculator/app', {
	component: lazy(() => import('./app')),
	pathName: 'calculator-app',
	wmGroup: 'calculator-app',
	wmSort: 1,
});
