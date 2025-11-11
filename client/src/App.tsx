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
import { useAuthSystem } from './core/auth-system';
function App() {
	const isAuth = useAuthSystem((state) => state.isAuth);
	const ref = useRef(null);
	useEffect(() => {
		if (ref.current?.refs?.main) {
			ref.current?.refs?.main?.setAttribute('id', 'windows_parent');
			core.$sm.WINDOW.set('parent', '#windows_parent');
		}
		//console.log(core.$sm.WINDOW);
	}, [ref.current, ref.current?.refs, ref.current?.refs?.main]);
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
				</Layout>
			)}
			<AuthForm />
		</>
	);
}

export default App;
