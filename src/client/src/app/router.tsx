import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import { isAuthenticated } from "@/features/auth/api/auth";
import LandingPage from "@/pages/landing/landing-page";
import ServerDetailsPage from "@/pages/servers/server-details-page";
import ServerListPage from "@/pages/servers/server-list-page";
import ServersLayout from "@/pages/servers/servers-layout";
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
								Component: ServerDetailsPage,
							},
						],
					},
				],
			},
		],
	},
]);

export default router;
