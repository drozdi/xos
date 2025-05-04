import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles/AppShell.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/Skeleton.css';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(
	<MantineProvider defaultColorScheme="dark">
		<App />
	</MantineProvider>,
);
