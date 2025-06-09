import { lazy } from 'react';
import { appManager } from '../../core/app-system/app-manager';

appManager.register('apps/tic-tac-toe/app', {
	pathName: 'tic-tac-toe-app',
	wmGroup: 'tic-tac-toe-app',
	component: lazy(() => import('./app')),
	wmSort: 1,
});
