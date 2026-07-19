import LandingPage from "@/pages/landing/landing-page";
import { serverQueryOptions } from "@/pages/servers/details/api/queries";
import ServerDetailsLayout from "@/pages/servers/details/server-details-layout";
import { myInfoQueryOptions } from "@/pages/servers/list/api/queries";
import ServerListEmptyPage from "@/pages/servers/list/server-list-empty-page";
import ServersLayout from "@/pages/servers/servers-layout";
import { HttpError } from "@/shared/api/fetch-json";
import { lazy } from "react";
import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import AuthLoading from "./auth-loading";
import { queryClient } from "./query-client";
import RouteErrorBoundary from "./route-error-boundary";

const ServerDetailsPage = lazy(
	() => import("@/pages/servers/details/server-details-page"),
);
const ServerSettingsPage = lazy(
	() => import("@/pages/servers/details/settings/server-settings-page"),
);
const TopicDetailsPage = lazy(
	() => import("@/pages/servers/details/topics/details/topic-details-page"),
);
const TopicEditPage = lazy(
	() => import("@/pages/servers/details/topics/edit/topic-edit-page"),
);

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

async function serverAdminOnlyLoader({ params }: LoaderFunctionArgs) {
	const serverId = params.serverId;

	if (!serverId) {
		throw redirect("/servers");
	}

	const serverData = await queryClient.ensureQueryData(
		serverQueryOptions(serverId),
	);

	if (!serverData.admin) {
		throw redirect(`/servers/${serverId}`);
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
				],
			},
			{
				loader: authOnlyLoader,
				shouldRevalidate: () => false,
				Component: RouteOutlet,
				children: [
					{
						path: "servers",
						Component: ServersLayout,
						children: [
							{
								index: true,
								Component: ServerListEmptyPage,
							},
							{
								path: ":serverId",
								Component: ServerDetailsLayout,
								children: [
									{
										index: true,
										Component: ServerDetailsPage,
									},
									{
										path: "settings",
										loader: serverAdminOnlyLoader,
										Component: ServerSettingsPage,
										handle: {
											serverAppBarTitle: "서버 설정",
											serverAppBarSubtitle: "server-name",
											serverContentSkeleton: "settings",
										},
									},
									{
										path: "topics/:topicId",
										Component: TopicDetailsPage,
										handle: {
											serverAppBarKind: "topic",
											serverContentSkeleton: "topic",
										},
									},
									{
										path: "topics/:topicId/edit",
										loader: serverAdminOnlyLoader,
										Component: TopicEditPage,
										handle: {
											serverAppBarKind: "topic-edit",
											serverContentSkeleton: "topic-edit",
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
