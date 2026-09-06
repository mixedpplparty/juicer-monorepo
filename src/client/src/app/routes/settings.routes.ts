import type { RouteObject } from "react-router";

export const settingsRoutes: RouteObject[] = [
	{
		path: "settings",
		lazy: async () => {
			const [{ default: Component }, { default: loader }] = await Promise.all([
				import("@/pages/server-settings/server-settings-page"),
				import("../server-admin-only-loader"),
			]);
			return { Component, loader };
		},
	},
];
