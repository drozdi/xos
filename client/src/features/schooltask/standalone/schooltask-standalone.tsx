import { createContext, useContext, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';

interface SchooltaskStandaloneContextValue {
	standalone: boolean;
	navigate: NavigateFunction | null;
}

const SchooltaskStandaloneContext = createContext<SchooltaskStandaloneContextValue>({
	standalone: false,
	navigate: null,
});

export function SchooltaskStandaloneProvider({
	standalone,
	navigate = null,
	children,
}: {
	standalone: boolean;
	navigate?: NavigateFunction | null;
	children: ReactNode;
}) {
	return (
		<SchooltaskStandaloneContext.Provider value={{ standalone, navigate }}>
			{children}
		</SchooltaskStandaloneContext.Provider>
	);
}

export function useSchooltaskStandalone(): SchooltaskStandaloneContextValue {
	return useContext(SchooltaskStandaloneContext);
}
