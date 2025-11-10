import { createContext, useContext } from 'react';

export const WindowContext = createContext<WindowContextValue | null>(null);

export const WindowProvider = ({ children, value }: WindowProviderProps) => (
	<WindowContext.Provider value={value}>{children}</WindowContext.Provider>
);

export function useWindowContext(): WindowContextValue | null {
	return useContext(WindowContext);
}
