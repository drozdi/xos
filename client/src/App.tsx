import {
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import { AuthForm } from './components/auth-form';
import { Layout } from './components/layout';
import { StartMenu } from './components/start-menu';
import { WindowManager } from './components/window-manager';
import { core } from './core';
import { appManager } from './core/app-system';
import { useAuthSystem } from './core/auth-system';
function App() {
	const isAuth = useAuthSystem((state) => state.isAuth);
	const ref = useRef(null);

	useEffect(() => {
		core.$sm.WINDOW.set('parent', '#windows_parent');
	}, []);

	useEffect(() => {
		isAuth && appManager.reloadApps();
	}, [isAuth]);

	const mouseSensor = useSensor(MouseSensor);
	const touchSensor = useSensor(TouchSensor);
	const keyboardSensor = useSensor(KeyboardSensor);
	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
	return (
		<>
			{isAuth && (
				<Layout container toggle ref={ref}>
					<Layout.Header>
						<div>header</div>
					</Layout.Header>
					<Layout.Footer px={0} py={0} slot="footer">
						<>
							<StartMenu />
							<WindowManager />
						</>
					</Layout.Footer>
					<div>main</div>
					<div
						id="windows_parent"
						style={{
							width: '100%',
							height: '100%',
							top: 0,
							left: 0,
							position: 'absolute',
							overflow: 'hidden',
						}}
					></div>
				</Layout>
			)}
			<AuthForm />
		</>
	);
}

export default App;
