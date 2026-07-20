import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import SignInFailedPage from "@/pages/exceptions/sign-in-failed-page";
import LandingPage from "@/pages/landing/landing-page";
import { myInfoQueryOptions } from "@/pages/server-list/api/queries";
import ServerListEmptyPage from "@/pages/server-list/server-list-empty-page";
import ServersLayout from "@/pages/server-list/servers-layout";
import { serverQueryOptions } from "@/pages/server-overview/api/queries";
import NoAdminPage from "@/pages/server-overview/no-admin-page";
import ServerDetailsLayout from "@/pages/server-overview/server-details-layout";
import ServerDetailsPage from "@/pages/server-overview/server-details-page";
import ServerSettingsPage from "@/pages/server-settings/server-settings-page";
import TopicDetailsPage from "@/pages/topic-details/topic-details-page";
import TopicEditPage from "@/pages/topic-edit/topic-edit-page";
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

async function serverAdminOnlyLoader({ params }: LoaderFunctionArgs) {
	const serverId = params.serverId;

	if (!serverId) {
		throw redirect("/servers");
	}

	const serverData = await queryClient.ensureQueryData(
		serverQueryOptions(serverId),
	);

	if (!serverData.admin) {
		throw redirect(`/servers/${serverId}/no-admin`);
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
						Component: SignInFailedPage,
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
										path: "no-admin",
										Component: NoAdminPage,
									},
									{
										path: "settings",
										loader: serverAdminOnlyLoader,
										Component: ServerSettingsPage,
									},
									{
										path: "topics/:topicId",
										Component: TopicDetailsPage,
									},
									{
										path: "topics/:topicId/edit",
										loader: serverAdminOnlyLoader,
										Component: TopicEditPage,
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
