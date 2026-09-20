import { createBrowserRouter, Outlet } from "react-router";
import AuthLoading from "./auth-loading";
import RouteErrorBoundary from "./route-error-boundary";
import { authOnlyLoader, guestRoutes } from "./routes/auth.routes";
import { serverRoutes } from "./routes/servers.routes";

export const router = createBrowserRouter([
	{
		Component: Outlet,
		HydrateFallback: AuthLoading,
		ErrorBoundary: RouteErrorBoundary,
		children: [
			guestRoutes,
			{
				loader: authOnlyLoader,
				shouldRevalidate: () => false,
				Component: Outlet,
				children: serverRoutes,
			},
		],
	},
]);
export default router;
