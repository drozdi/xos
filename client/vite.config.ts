import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		tailwindcss(),
		mode === 'analyze' &&
			visualizer({
				filename: 'dist/stats.html',
				gzipSize: true,
				brotliSize: true,
				open: false,
			}),
	].filter(Boolean),
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@inccom': path.resolve(__dirname, 'src/features/inccom'),
		},
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
		'process.env.DRAGGABLE_DEBUG': JSON.stringify(''),
	},
	test: {
		globals: false,
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
	server: {
		port: 5173,
		proxy: {
			'/api': 'http://localhost:8000',
		},
	},
	optimizeDeps: {
		include: ['react-quill-new', 'quill', 'lodash-es'],
	},
	build: {
		target: 'es2022',
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (
						id.includes('node_modules/react/') ||
						id.includes('node_modules/react-dom/')
					) {
						return 'vendor';
					}
					if (id.includes('node_modules/@tanstack/react-query')) {
						return 'query';
					}
					if (
						id.includes('node_modules/react-rnd') ||
						id.includes('node_modules/react-draggable') ||
						id.includes('node_modules/re-resizable')
					) {
						return 'rnd';
					}
					if (id.includes('node_modules/react-window')) {
						return 'react-window';
					}
					if (id.includes('node_modules/axios')) {
						return 'axios';
					}
					if (id.includes('node_modules/zustand')) {
						return 'zustand';
					}
					if (id.includes('/src/apps/')) {
						const match = id.match(/\/apps\/([^/]+)\//);
						if (match) {
							return `app-${match[1]}`;
						}
					}
				},
			},
		},
	},
}));
