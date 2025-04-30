import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles/global.css';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const theme = createTheme({
});

createRoot(document.getElementById('root')).render(
  <MantineProvider  theme={theme}>
    <App />
  </MantineProvider>,
)
