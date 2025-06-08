import { Skeleton } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import './App.css';
import { Layout } from './components/layout';
import { XFooter } from './components/layout/ui/footer';
import { StartMenu } from './components/start-menu';
import { Window } from './components/window';
import { WindowManager } from './components/window-manager';

function App() {
	return (
		<Layout container toggle>
			<div slot="header">header</div>
			<XFooter px={0} py={0} slot="footer">
				<StartMenu />
				<WindowManager />
			</XFooter>
			<div slot="left">
				{Array(25)
					.fill(0)
					.map((_, index) => (
						<Skeleton key={index} h={28} mt="sm" animate={false} />
					))}
			</div>

			<div>
				<Window
					title="Win 1"
					draggable
					resizable
					icons="reload collapse fullscreen close"
					w={200}
					h={200}
				>
					sdfsdf
				</Window>
				<Window
					title="Win 2"
					draggable
					resizable
					icons="reload collapse fullscreen close"
					w={200}
					h={200}
				>
					sdfsdf
				</Window>
			</div>
		</Layout>
	);
}

export default App;
