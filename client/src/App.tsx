import './App.css';
import { Layout } from './components/layout';
import { XFooter } from './components/layout/ui';
import { StartMenu } from './components/start-menu';
import { WindowManager } from './components/window-manager';

function App() {
	return (
		<Layout container toggle>
			<div slot="header">header</div>
			<XFooter px={0} py={0} slot="footer">
				<StartMenu />
				<WindowManager />
			</XFooter>
			<div></div>
		</Layout>
	);
}

export default App;
