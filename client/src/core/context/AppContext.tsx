import { createContext, useContext, type ReactNode } from 'react';

import type { AppManifest } from '@/core/appManager/types';

export interface AppContextValue {
	appId: string;
	windowId: string;
	instanceKey: string;
	props?: Record<string, unknown>;
	manifest: AppManifest;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
	value: AppContextValue;
	children: ReactNode;
}

export function AppProvider({ value, children }: AppProviderProps) {
	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within AppProvider');
	}
	return context;
}
