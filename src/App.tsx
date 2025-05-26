import { Skeleton } from '@mantine/core';
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import './App.css';
import { Layout } from './components/layout';

function App() {
	return (
		<Layout container>
			<div slot="header">header</div>
			<div slot="footer">footer</div>
			<div slot="left">
				{Array(25)
					.fill(0)
					.map((_, index) => (
						<Skeleton key={index} h={28} mt="sm" animate={false} />
					))}
			</div>

			<div>123</div>
		</Layout>
	);
}

export default App;
