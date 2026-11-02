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
					globIgnores: ['**/stats.html', '**/editor-*.js', '**/app-*.js'],
					maximumFileSizeToCacheInBytes: 400 * 1024,
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
		environmentMatchGlobs: [['src/**/*.test.tsx', 'happy-dom']],
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
		modulePreload: {
			resolveDependencies(_filename, deps) {
				return deps.filter((dep) => !/\/(?:app|editor)-/.test(dep));
			},
		},
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) {
						if (id.includes('/src/apps/')) {
							const match = id.match(/\/apps\/([^/]+)\//);
							if (match && !id.endsWith('/index.ts')) {
								return `app-${match[1]}`;
							}
						}
						return;
					}
					if (id.includes('@mantine')) {
						return 'mantine';
					}
					if (id.includes('tiptap') || id.includes('prosemirror')) {
						return 'editor';
					}
					if (
						id.includes('/react/') ||
						id.includes('/react-dom/') ||
						id.includes('react-router')
					) {
						return 'react';
					}
					if (id.includes('/zod/') || id.includes('/axios/') || id.includes('@tanstack/react-query')) {
						return 'core-vendor';
					}
				},
			},
		},
	},
}));
