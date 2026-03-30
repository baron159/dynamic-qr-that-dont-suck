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
			treeshake: true
		}
	}
});
