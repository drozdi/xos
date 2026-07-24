import { createContext, useContext, type ReactNode } from 'react';

/** `true` — отдельная страница `/inccom`; `false` — окно в Desktop (корень). */
const IncComStandaloneContext = createContext(false);

export function IncComStandaloneProvider({
	standalone,
	children,
}: {
	standalone: boolean;
	children: ReactNode;
}) {
	return (
		<IncComStandaloneContext.Provider value={standalone}>
			{children}
		</IncComStandaloneContext.Provider>
	);
}

export function useIncComStandalone(): boolean {
	return useContext(IncComStandaloneContext);
}
