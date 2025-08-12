import { createContext, ReactNode, useContext } from 'react';

interface XSidebarContextType {
	type?: 'left' | 'right';
	width?: number;
	mini?: boolean;
	open?: boolean;
	getElement?: () => HTMLElement | null;
	toggleMini?: (event: React.MouseEvent) => void;
	toggle?: (event: React.MouseEvent) => void;
}
interface XSidebarProviderProps {
	children: ReactNode;
	value: XSidebarContextType;
}

export const XSidebarContext = createContext<XSidebarContextType>({
	mini: false,
	open: false,
});

export const XSidebarProvider = ({ children, value }: XSidebarProviderProps) => (
	<XSidebarContext.Provider value={value}>{children}</XSidebarContext.Provider>
);

export function useXSidebarContext(): XSidebarContextType {
	return useContext(XSidebarContext);
}
