import { createElement } from 'react';

import type { CoreApi } from '@/core/context/types';

import { NewGameDialog } from './NewGameDialog';
import { useSudokuStore } from './store';

export function openNewGameDialog(coreApi: CoreApi) {
	const handle = coreApi.window.createChildWindow({
		title: 'Новая игра',
		width: 360,
		height: 420,
		content: createElement(NewGameDialog),
	});
	useSudokuStore.getState().setActiveDialogId(handle.id);
	return handle;
}
