import { Layout } from './components/layout';
import { StartMenu } from './components/start-menu';
import { WindowManager } from './components/window-manager';

function App() {
	//const isAuth = useAuthSystem((state) => state.isAuth);
	const isAuth = true;
	return (
		<>
			{isAuth && (
				<Layout container toggle>
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
			{/* <AuthForm /> */}
		</>
	);
}

export default App;
