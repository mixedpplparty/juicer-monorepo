import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { SignInFailed } from "./pages/Auth/SignInFailed";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Landing } from "./pages/Landing/Landing";
import { Loading } from "./pages/Loading/Loading";
import { GameSettings } from "./pages/Server/GameSettings";
import { Server } from "./pages/Server/Server";
import { ServerSettings } from "./pages/Server/ServerSettings";
import { _fetchMyTokens } from "./remotes/remotes";

const App = () => {
	const _authQuery = useQuery(_fetchMyTokens.query());

	if (_authQuery.isLoading) {
		return <Loading />;
	} // can't use suspense here

	const isAuthenticated =
		_authQuery.data?.discord_access_token && !_authQuery.isError;

	const router = createBrowserRouter([
		...(isAuthenticated
			? [
					{ path: "*", element: <Dashboard /> },
					{ path: "/server", element: <Server /> },
					{ path: "/server/settings", element: <ServerSettings /> },
					{ path: "/server/game", element: <GameSettings /> },
				]
			: [
					{ path: "*", element: <Landing /> },
					{
						path: "/sign-in-failed",
						element: <SignInFailed />,
					},
				]),
	]);

	return (
		<Suspense fallback={<Loading />}>
			<RouterProvider router={router} />
		</Suspense>
	);
};

export default App;
