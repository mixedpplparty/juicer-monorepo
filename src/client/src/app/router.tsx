import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import { isAuthenticated } from "@/features/auth/api/auth";
import { fetchServerData } from "@/features/servers/api/server-queries";
import LandingPage from "@/pages/landing/landing-page";
import ServerDetailsLayout from "@/pages/servers/server-details-layout";
import ServerDetailsPage from "@/pages/servers/server-details-page";
import ServerListPage from "@/pages/servers/server-list-page";
import ServerSettingsPage from "@/pages/servers/server-settings-page";
import ServersLayout from "@/pages/servers/servers-layout";
import TopicAddPage from "@/pages/servers/topic-add-page";
import AuthLoading from "./auth-loading";
import RouteErrorBoundary from "./route-error-boundary";

async function guestOnlyLoader({ request }: LoaderFunctionArgs) {
	if (await isAuthenticated(request)) {
		throw redirect("/servers");
	}

	return null;
}

async function authOnlyLoader({ request }: LoaderFunctionArgs) {
	if (!(await isAuthenticated(request))) {
		throw redirect("/");
	}

	return null;
}

async function serverAdminOnlyLoader({ params }: LoaderFunctionArgs) {
	const serverId = params.serverId;

	if (!serverId) {
		throw redirect("/servers");
	}

	const serverData = await fetchServerData(serverId);

	if (!serverData.admin) {
		throw redirect(`/servers/${serverId}`);
	}

	return null;
}

function RouteOutlet() {
	return <Outlet />;
}

export const router = createBrowserRouter([
	{
		Component: RouteOutlet,
		HydrateFallback: AuthLoading,
		ErrorBoundary: RouteErrorBoundary,
		children: [
			{
				loader: guestOnlyLoader,
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
				Component: RouteOutlet,
				children: [
					{
						path: "servers",
						Component: ServersLayout,
						children: [
							{
								index: true,
								Component: ServerListPage,
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
										path: "topics/new",
										loader: serverAdminOnlyLoader,
										Component: TopicAddPage,
									},
									{
										path: "settings",
										loader: serverAdminOnlyLoader,
										Component: ServerSettingsPage,
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
