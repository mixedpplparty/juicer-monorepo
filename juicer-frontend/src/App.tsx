import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { SignInFailed } from "./pages/Auth/SignInFailed";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Landing } from "./pages/Landing/Landing";
import { _fetchUserData } from "./queries/queries";
import { Suspense } from "react";
import { Loading } from "./pages/Loading/Loading";

// TODO Determine if it's user's first time
// if it is navigate to OOBE or else Dashboard

const App = () => {
	const _auth = useSuspenseQuery({
		queryKey: ["auth"],
		queryFn: _fetchUserData,
	});

	const router = createBrowserRouter([
		...(_auth.data?.discord_access_token
			? [{ path: "*", element: <Dashboard /> }]
			: [
					{ path: "*", element: <Landing /> },
					{
						path: "sign-in-failed",
						element: <SignInFailed />,
					},
				]),
	]);
	return <Suspense fallback={<Loading />}><RouterProvider router={router} /></Suspense>;
};

export default App;
