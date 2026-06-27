import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ToastProvider from "./contexts/ToastContext";

const _queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Heavy endpoints (full server data) were refetching on every mount and
			// window focus because RQ defaults to staleTime 0. Treat data as fresh
			// briefly so navigation reuses the cache instead of re-hitting the API,
			// and don't refetch on focus. Mutations invalidate explicitly.
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={_queryClient}>
		<ToastProvider>
			<App />
		</ToastProvider>
	</QueryClientProvider>,
);
