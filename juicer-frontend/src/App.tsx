import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
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
	const _authQuery = useSuspenseQuery(_fetchMyTokens.query());

	useEffect(() => {
		console.log("isError", _authQuery.isError);
	}, [_authQuery.isError]);
	useEffect(() => {
		console.log("error", _authQuery.error);
	}, [_authQuery.error]);

	if (_authQuery.isError) {
		return <Landing />;
	}

	const isAuthenticated =
		_authQuery.data?.data?.discord_access_token && !_authQuery.isError;

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
