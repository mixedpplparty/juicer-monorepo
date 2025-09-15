import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
// https://vite.dev/config/
export default defineConfig(() => {
	return {
		plugins: [react(), svgr()],
		server: {
			allowedHosts: ["juicer.r1c.cc"],
		},
	};
});
