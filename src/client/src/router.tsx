import {
	createBrowserRouter,
	type LoaderFunctionArgs,
	Outlet,
	redirect,
} from "react-router";
import AuthLoading from "./components/auth-loading";
import RouteErrorBoundary from "./components/error-boundary";
import _isAuthenticated from "./modules/auth/auth-check";
import SignInPage from "./pages/auth/login";
import ServerPage from "./pages/dashboard/server-details-page";
import ServersPage from "./pages/dashboard/server-list-page";
import LandingPage from "./pages/landing/landing";

async function _guestOnlyLoader({ request }: LoaderFunctionArgs) {
	if ((await _isAuthenticated(request)) === true) {
		throw redirect("/servers");
	}

	return null;
}

async function _authOnlyLoader({ request }: LoaderFunctionArgs) {
	if ((await _isAuthenticated(request)) !== true) {
		const url = new URL(request.url);
		const redirectTo = `${url.pathname}${url.search}`;
		throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
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
					{
						path: "login",
						Component: SignInPage,
					},
				],
			},
			{
				loader: _authOnlyLoader,
				Component: RouteOutlet,
				children: [
					{
						path: "servers",
						Component: ServersPage,
					},
					{
						path: "servers/:serverId",
						Component: ServerPage,
					},
				],
			},
		],
	},
]);

export default router;
