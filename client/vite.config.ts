import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		tailwindcss(),
		mode !== 'test' &&
			VitePWA({
				registerType: 'autoUpdate',
				devOptions: {
					enabled: false,
				},
				manifest: {
					name: 'XOS',
					short_name: 'XOS',
					theme_color: '#15171e',
					background_color: '#15171e',
					display: 'standalone',
					start_url: '/',
					icons: [
						{
							src: '/vite.svg',
							sizes: 'any',
							type: 'image/svg+xml',
							purpose: 'any',
						},
					],
				},
				workbox: {
					globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
					navigateFallback: '/index.html',
					runtimeCaching: [],
				},
			}),
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
			'/uploads': 'http://localhost:8000',
		},
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
