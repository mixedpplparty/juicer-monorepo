import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import AuthLoading from "./components/auth-loading";
import RouteErrorBoundary from "./components/error-boundary";
import ServersPage from "./pages/dashboard/server-list-page";
import ServersLayout from "./pages/dashboard/servers-layout";
import LandingPage from "./pages/landing/landing";
import ServerDetailsPage from "./pages/server/server-details-page";
import { _isAuthenticated } from "./remotes/remotes";

async function _guestOnlyLoader({ request }: LoaderFunctionArgs) {
	if ((await _isAuthenticated(request)) === true) {
		throw redirect("/servers");
	}

	return null;
}

async function _authOnlyLoader({ request }: LoaderFunctionArgs) {
	if ((await _isAuthenticated(request)) !== true) {
		throw redirect(`/`);
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
				loader: _guestOnlyLoader,
				Component: RouteOutlet,
				children: [
					{
						index: true,
						Component: LandingPage,
					},
				],
			},
			{
				loader: _authOnlyLoader,
				Component: RouteOutlet,
				children: [
					{
						path: "servers",
						Component: ServersLayout,
						children: [
							{
								index: true,
								Component: ServersPage,
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
