import './App.css';
import { Layout } from './components/layout';

function App() {
	return (
		<Layout container>
			<div slot="left">left</div>
			<div>123</div>
		</Layout>
	);
}

export default App;
