import { createBrowserRouter, Outlet, redirect } from "react-router";
import LandingPage from "@/pages/landing/landing-page";
import { myInfoQueryOptions } from "@/pages/server-list/api/queries";
import { HttpError } from "@/shared/api/fetch-json";
import AuthLoading from "./auth-loading";
import { queryClient } from "./query-client";
import RouteErrorBoundary from "./route-error-boundary";

async function getCurrentUser() {
	try {
		return await queryClient.fetchQuery(myInfoQueryOptions());
	} catch (error) {
		if (error instanceof HttpError && error.status === 401) {
			return null;
		}

		throw error;
	}
}

async function guestOnlyLoader() {
	if (await getCurrentUser()) {
		throw redirect("/servers");
	}

	return null;
}

async function authOnlyLoader() {
	if (!(await getCurrentUser())) {
		throw redirect("/");
	}

	return null;
}

function RouteOutlet() {
	return <Outlet />;
}

function RootOutlet() {
	return <Outlet />;
}

export const router = createBrowserRouter([
	{
		Component: RootOutlet,
		HydrateFallback: AuthLoading,
		ErrorBoundary: RouteErrorBoundary,
		children: [
			{
				loader: guestOnlyLoader,
				shouldRevalidate: () => false,
				Component: RouteOutlet,
				children: [
					{
						index: true,
						Component: LandingPage,
					},
					{
						path: "sign-in-failed",
						lazy: async () => {
							const { default: Component } = await import(
								"@/pages/exceptions/sign-in-failed-page"
							);

							return { Component };
						},
					},
				],
			},
			{
				loader: authOnlyLoader,
				shouldRevalidate: () => false,
				Component: RouteOutlet,
				children: [
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
									{
										path: "settings",
										lazy: async () => {
											const [{ default: Component }, { default: loader }] =
												await Promise.all([
													import(
														"@/pages/server-settings/server-settings-page"
													),
													import("./server-admin-only-loader"),
												]);

											return { Component, loader };
										},
									},
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
											const [{ default: Component }, { default: loader }] =
												await Promise.all([
													import("@/pages/topic-edit/topic-edit-page"),
													import("./server-admin-only-loader"),
												]);

											return { Component, loader };
										},
									},
								],
							},
						],
					},
				],
			},
		],
	},
]);

export default router;
