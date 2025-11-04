import '@mantine/core/styles.css';

import { createRoot } from 'react-dom/client';
import App from './App';
import { core as XOS } from './core';
XOS.app(
	App,
	{
		smKey: 'core',
	},
	createRoot(document.querySelector('body')),
);
