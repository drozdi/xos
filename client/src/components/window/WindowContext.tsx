import { createContext, ReactNode, useContext } from 'react';

interface WindowContextType {}
interface WindowProps {
	children: ReactNode;
	value: any;
}

export const WindowContext = createContext<any | WindowContextType | null>(null);

export const WindowProvider = ({ children, value }: WindowProps) => (
	<WindowContext.Provider value={value}>{children}</WindowContext.Provider>
);

export function useWindowContext(): any | null {
	return useContext(WindowContext);
}
