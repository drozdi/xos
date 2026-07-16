import { createContext, useContext } from 'react';

export interface WindowManagerViewport {
	width: number;
	height: number;
}

const WindowManagerViewportContext = createContext<WindowManagerViewport>({
	width: 0,
	height: 0,
});

export function useWindowManagerViewport(): WindowManagerViewport {
	return useContext(WindowManagerViewportContext);
}

export { WindowManagerViewportContext };
