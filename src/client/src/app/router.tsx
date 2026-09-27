import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { createBrowserRouter, Outlet } from "react-router";
import AuthLoading from "./auth-loading";
import RouteErrorBoundary from "./route-error-boundary";
import { authOnlyLoader, guestRoutes } from "./routes/auth.routes";
import { serverRoutes } from "./routes/servers.routes";

function RootLayout() {
	return (
		<NuqsAdapter>
			<Outlet />
		</NuqsAdapter>
	);
}

export const router = createBrowserRouter([
	{
		Component: RootLayout,
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
