import { createContext, useContext, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';

interface CalendarStandaloneContextValue {
	standalone: boolean;
	navigate: NavigateFunction | null;
}

const CalendarStandaloneContext = createContext<CalendarStandaloneContextValue>({
	standalone: false,
	navigate: null,
});

export function CalendarStandaloneProvider({
	standalone,
	navigate = null,
	children,
}: {
	standalone: boolean;
	navigate?: NavigateFunction | null;
	children: ReactNode;
}) {
	return (
		<CalendarStandaloneContext.Provider value={{ standalone, navigate }}>
			{children}
		</CalendarStandaloneContext.Provider>
	);
}

export function useCalendarStandalone(): CalendarStandaloneContextValue {
	return useContext(CalendarStandaloneContext);
}
