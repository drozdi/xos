import { createContext, useContext, type ReactNode } from 'react';

import type { CoreApi } from './types';

const CoreApiContext = createContext<CoreApi | null>(null);

interface CoreApiProviderProps {
	coreApi: CoreApi;
	children: ReactNode;
}

export function CoreApiProvider({ coreApi, children }: CoreApiProviderProps) {
	return <CoreApiContext.Provider value={coreApi}>{children}</CoreApiContext.Provider>;
}

export function useCoreApiContext(): CoreApi {
	const context = useContext(CoreApiContext);
	if (!context) {
		throw new Error('useCoreApiContext must be used within CoreApiProvider');
	}
	return context;
}
