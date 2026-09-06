import type { RouteObject } from "react-router";
import { settingsRoutes } from "./settings.routes";
import { topicRoutes } from "./topics.routes";

export const serverRoutes: RouteObject[] = [
	{
		path: "servers",
		lazy: async () => {
			const { default: Component } = await import(
				"@/pages/server-list/servers-layout"
			);
			return { Component };
		},
		children: [
			{
				index: true,
				lazy: async () => {
					const { default: Component } = await import(
						"@/pages/server-list/server-list-empty-page"
					);
					return { Component };
				},
			},
			{
				path: ":serverId",
				lazy: async () => {
					const { default: Component } = await import(
						"@/pages/server-overview/server-details-layout"
					);
					return { Component };
				},
				children: [
					{
						index: true,
						lazy: async () => {
							const { default: Component } = await import(
								"@/pages/server-overview/server-details-page"
							);
							return { Component };
						},
					},
					{
						path: "no-admin",
						lazy: async () => {
							const { default: Component } = await import(
								"@/pages/server-overview/no-admin-page"
							);
							return { Component };
						},
					},
					...settingsRoutes,
					...topicRoutes,
				],
			},
		],
	},
];
