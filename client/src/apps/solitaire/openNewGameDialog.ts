import { createElement } from 'react';

import type { CoreApi } from '@/core/context/types';

import { NewGameDialog } from './NewGameDialog';
import { useSolitaireStore } from './store';

export function openNewGameDialog(coreApi: CoreApi) {
	const handle = coreApi.window.createChildWindow({
		title: 'Новая игра',
		width: 340,
		height: 280,
		content: createElement(NewGameDialog),
	});
	useSolitaireStore.getState().setActiveDialogId(handle.id);
	return handle;
}
