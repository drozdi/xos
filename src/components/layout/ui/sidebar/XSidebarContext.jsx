import { createContext, useContext } from 'react';

export const XSidebarContext = createContext({
	mini: false,
	open: false,
});

export const XSidebarProvider = ({ children, value }) => (
	<XSidebarContext.Provider value={value}>{children}</XSidebarContext.Provider>
);

export function useXSidebarContext() {
	return useContext(XSidebarContext);
}
