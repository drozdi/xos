import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
//import eslint from 'vite-plugin-eslint';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	css: {
		postcss: './postcss.config.js',
	},
	server: {
		open: true,
		cors: true,
		proxy: {
			'/api': 'http://xos',
		},
	},
});
