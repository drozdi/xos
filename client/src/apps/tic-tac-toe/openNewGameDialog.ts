import { createElement } from 'react';

import type { CoreApi } from '@/core/context/types';

import { NewGameDialog } from './NewGameDialog';
import { useTicTacToeStore } from './store';

export function openNewGameDialog(coreApi: CoreApi) {
	const handle = coreApi.window.createChildWindow({
		title: 'Новая игра',
		width: 360,
		height: 300,
		content: createElement(NewGameDialog),
	});
	useTicTacToeStore.getState().setActiveDialogId(handle.id);
	return handle;
}
