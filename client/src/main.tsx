import './process-shim';

import { createRoot } from 'react-dom/client';

import App from './App';
import { applyDocumentTheme, xosColorSchemeManager } from '@/core/theme/xosColorSchemeManager';
import './styles/globals.css';

applyDocumentTheme(xosColorSchemeManager().get());

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element #root not found');
}

createRoot(rootElement).render(<App />);
