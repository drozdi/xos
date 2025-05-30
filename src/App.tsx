import { Skeleton } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import './App.css';
import { Layout } from './components/layout';
import { Window } from './components/window';

function App() {
	return (
		<Layout container toggle>
			<div slot="header">header</div>
			<div slot="footer">footer</div>
			<div slot="left">
				{Array(25)
					.fill(0)
					.map((_, index) => (
						<Skeleton key={index} h={28} mt="sm" animate={false} />
					))}
			</div>

			<div>
				<Window title="title" resizable icons="reload collapse fullscreen close">
					efwefewf
				</Window>
			</div>
		</Layout>
	);
}

export default App;
