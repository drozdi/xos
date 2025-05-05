import { createContext, useContext } from 'react';

export const XLayoutContext = createContext();

export const XLayoutProvider = ({ children, value }) => (
	<XLayoutContext.Provider value={value}>{children}</XLayoutContext.Provider>
);

export const useXLayoutContext = () => {
	return useContext(XLayoutContext);
};
