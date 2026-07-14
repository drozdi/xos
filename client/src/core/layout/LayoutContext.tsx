import { createContext, useContext } from 'react';

import type { ParsedLayout } from './parseView';

export type PanelSide = 'left' | 'right';

export interface LayoutContextValue {
	parsed: ParsedLayout;
	leftWidth: number;
	rightWidth: number;
	setLeftWidth: (width: number) => void;
	setRightWidth: (width: number) => void;
	isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const LayoutProvider = LayoutContext.Provider;

export function useLayoutContext(): LayoutContextValue {
	const context = useContext(LayoutContext);
	if (!context) {
		throw new Error('useLayoutContext must be used within Layout');
	}
	return context;
}
