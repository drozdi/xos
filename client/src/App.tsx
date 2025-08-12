import './App.css';
import { AuthForm } from './components/auth-form';
import { Layout } from './components/layout';
import { XFooter } from './components/layout/ui';
import { StartMenu } from './components/start-menu';
import { WindowManager } from './components/window-manager';

function App() {
	return (
		<Layout container>
			<Layout.Header>
				<span>header</span>
			</Layout.Header>
			<Layout.Footer>
				<span>footer</span>
			</Layout.Footer>
			<Layout.Left>
				<span>left</span>
			</Layout.Left>
			main
		</Layout>
	);
	return (
		<>
			<Layout container toggle>
				<div slot="header">header</div>
				<XFooter px={0} py={0} slot="footer">
					<StartMenu />
					<WindowManager />
				</XFooter>
				<div></div>
			</Layout>
			<AuthForm />
		</>
	);
}

export default App;
