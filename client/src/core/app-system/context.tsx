import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
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
	const mouseSensor = useSensor(MouseSensor);
	const touchSensor = useSensor(TouchSensor);
	const keyboardSensor = useSensor(KeyboardSensor);
	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
	return (
		<AppContext.Provider value={app}>
			<DndContext sensors={sensors}>
				<MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
			</DndContext>
		</AppContext.Provider>
	);
};

export function useApp(): React.Context<any> {
	return useContext(AppContext);
}
