import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';
import '@mantine/notifications/styles.css';
import './process-shim';

import { createRoot } from 'react-dom/client';

import App from './App';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
	<App />,
);
