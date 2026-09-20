import type { RouteObject } from "react-router";

export const topicRoutes: RouteObject[] = [
	{
		path: "topics/:topicId",
		lazy: async () => {
			const { default: Component } = await import(
				"@/pages/topic-details/topic-details-page"
			);
			return { Component };
		},
	},
	{
		path: "topics/:topicId/edit",
		lazy: async () => {
			const [{ default: Component }, { default: loader }] = await Promise.all([
				import("@/pages/topic-edit/topic-edit-page"),
				import("../server-admin-only-loader"),
			]);
			return { Component, loader };
		},
	},
];
