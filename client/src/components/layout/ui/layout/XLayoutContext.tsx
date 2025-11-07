import React, { createContext, useContext } from 'react';

type e = 'l' | 'h' | 'r' | 'f' | 'p';

interface XLayoutContextValue {
	instances?: {
		header: boolean;
		footer: boolean;
		left: boolean;
		right: boolean;
	};
	joinInstance?: (
		instance: 'header' | 'footer' | 'left' | 'right',
		val: boolean,
	) => void;
	container?: boolean;
	rows?: Array<e[]>;
	width?: number;
	height?: number;
}

export const XLayoutContext = createContext<XLayoutContextValue | null>(null);

export const XLayoutProvider = ({
	children,
	value,
}: {
	children: React.ReactElement;
	value: XLayoutContextValue;
}) => <XLayoutContext.Provider value={value}>{children}</XLayoutContext.Provider>;

export const useXLayoutContext = (): XLayoutContextValue | null => {
	return useContext<XLayoutContextValue | null>(XLayoutContext);
};
