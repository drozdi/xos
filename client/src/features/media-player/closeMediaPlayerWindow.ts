import { getWindowApi } from '@/core/windowManager/windowApiRegistry';
import { useWmStore } from '@/core/windowManager/useWmStore';

import { useMediaPlayerStore } from './mediaPlayerStore';

export async function closeMediaPlayerWindow(windowId: string, force = false): Promise<void> {
	const api = getWindowApi(windowId);
	if (api) {
		const closed = await api.close(force);
		if (closed !== false) {
			useMediaPlayerStore.getState().clearSession(windowId);
		}
		return;
	}

	useMediaPlayerStore.getState().clearSession(windowId);
	useWmStore.getState().closeWindow(windowId);
}

/** Defer until Mantine menu finishes closing — otherwise click may be swallowed. */
export function scheduleCloseMediaPlayerWindow(windowId: string, force = false): void {
	window.setTimeout(() => {
		void closeMediaPlayerWindow(windowId, force);
	}, 0);
}
