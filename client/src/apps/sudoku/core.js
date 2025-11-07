import { lazy } from 'react';
import { appManager } from '../../core/app-system/app-manager';

appManager.register('apps/sudoku/app', {
	component: lazy(() => import('./app')),
	pathName: 'sudoku-app',
	wmGroup: 'sudoku-app',
	wmSort: 1,
});
