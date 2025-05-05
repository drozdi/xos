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
			<div slot="left">left</div>
			<div slot="right">right</div>
			<div>123</div>
		</Layout>
	);
}

export default App;
