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
					globIgnores: [
						'**/stats.html',
						'**/editor-*.js',
						'**/app-*.js',
						'**/*App-*.js',
						'**/MarkdownWysiwygEditor-*.js',
						'**/mantine-*.js',
						'**/dist-*.js',
						'**/lib-*.js',
						'**/SshApp-*.js',
						'**/core-vendor-*.js',
						'**/shared-*.js',
						'**/react-*.js',
					],
					maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
					navigateFallback: '/index.html',
					runtimeCaching: [
						{
							urlPattern: ({ request, url }) => {
								if (request.method !== 'GET') {
									return false;
								}
								if (!url.pathname.startsWith('/api/')) {
									return false;
								}
								if (
									url.pathname.startsWith('/api/login') ||
									url.pathname.startsWith('/api/token/refresh') ||
									url.pathname.startsWith('/api/auth/login') ||
									url.pathname.startsWith('/api/auth/refresh')
								) {
									return false;
								}
								return true;
							},
							handler: 'NetworkFirst',
							options: {
								cacheName: 'xos-api-get',
								networkTimeoutSeconds: 8,
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 5 * 60,
								},
								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
					],
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
			'#dev/vitest/render': path.resolve(__dirname, 'src/test/render.tsx'),
		},
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
		'process.env.DRAGGABLE_DEBUG': JSON.stringify(''),
	},
	test: {
		globals: false,
		environment: 'node',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
		setupFiles: ['src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			thresholds: {
				statements: 1,
				lines: 1,
			},
		},
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
		modulePreload: false,
		rollupOptions: {
			output: {
				manualChunks(id) {
					const normalized = id.replace(/\\/g, '/');
					// Only isolate React. App/shared/editor manual chunks make Rolldown
					// place shared modules into TipTap-bearing chunks that the entry
					// then loads statically — breaking the 250 KB startup budget.
					if (
						normalized.includes('/node_modules/react/')
						|| normalized.includes('/node_modules/react-dom/')
						|| normalized.includes('/node_modules/scheduler/')
					) {
						return 'react';
					}
				},
			},
		},
	},
}));
