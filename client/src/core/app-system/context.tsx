import { MantineProvider } from '@mantine/core';
import { createContext, ReactNode, useContext } from 'react';
export const AppContext = createContext<any>(null);
export const AppProvider = ({
	children,
	app,
	...config
}: {
	children: ReactNode;
	app: any;
	[key: string]: any;
}) => {
	return (
		<AppContext.Provider value={app}>
			<MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
		</AppContext.Provider>
	);
};

export function useApp(): React.Context<any> {
	return useContext(AppContext);
}
