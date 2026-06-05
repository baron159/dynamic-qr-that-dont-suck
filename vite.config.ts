import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";

export default defineConfig({
	plugins: [react(), cloudflare()],
	server: {
		allowedHosts: ['dev.baron.solutions', 'wdev.baron.solutions'],
		port: 7000
	},
	resolve: {
		alias: {
			'pc': path.resolve(__dirname, 'prisma/generated'),
		}
	},
	build: {
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			external: [],
			treeshake: true,
			output: {
				manualChunks: id => {
					if (
						id.includes('@prisma/client') ||
						id.includes('.prisma/client')
						// id.includes('zod-prisma-types') || 
						// id.includes('@prisma/adapter-d1'

					) {
						return 'prisma-client';
					}
					if (id.includes('@mantine/core')) {
						return 'mantine-core';
					}
					if (id.includes('@mantine/hooks')) {
						return 'mantine-hooks';
					}
					if (id.includes('@mantine')) {
						return 'mantine-else';
					}
					// if (id.includes('@tabler/icons-react')) {
					// 	return 'tabler-icons';
					// }
					// if (id.includes('react') || id.includes('react-dom')) {
					//   return 'react-vendor';
					// }
					if (id.includes('/stripe/')) {
						return 'stripe';
					}

					if (id.includes('/hono/')) {
						return 'hono';
					}
					// if (id.includes('/marked/')) {
					// 	return 'marked';
					// }
					// if (id.includes('/@tiptap/')) {
					// 	return 'tiptap';
					// }
					if (id.includes('luxon')) {
						return 'luxon';
					}
					if (id.includes('zod')) {
						return 'zod';
					}
					if (id.includes('node_modules')) {
						return `vendor`;
					}
				}
			}
		}
	}
});
