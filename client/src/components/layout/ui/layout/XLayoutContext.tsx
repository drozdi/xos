import React, { createContext, useContext } from 'react';

type e = 'l' | 'h' | 'r' | 'f' | 'p';

interface XLayoutContextProps {
	instances?: Record<string, any>;
	container?: boolean;
	rows?: Array<e[]>;
	width?: number;
	height?: number;
}

export const XLayoutContext = createContext<XLayoutContextProps | null>(null);

export const XLayoutProvider = ({
	children,
	value,
}: {
	children: React.ReactElement;
	value: XLayoutContextProps;
}) => <XLayoutContext.Provider value={value}>{children}</XLayoutContext.Provider>;

export const useXLayoutContext = (): XLayoutContextProps | null => {
	return useContext<XLayoutContextProps | null>(XLayoutContext);
};
