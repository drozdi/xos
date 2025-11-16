import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { MantineProvider } from '@mantine/core';
import { createContext, ReactNode, useContext } from 'react';
import { settingManager } from '../setting-system';
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
	settingManager;
	const mouseSensor = useSensor(MouseSensor);
	const touchSensor = useSensor(TouchSensor);
	const keyboardSensor = useSensor(KeyboardSensor);
	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
	return (
		<AppContext.Provider value={app}>
			<DndContext
				sensors={sensors}
				modifiers={[
					(...args) => {
						//console.log(args);
						return restrictToParentElement(...args);
					},
				]}
			>
				<MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
			</DndContext>
		</AppContext.Provider>
	);
};

export function useApp(): React.Context<any> {
	return useContext(AppContext);
}
