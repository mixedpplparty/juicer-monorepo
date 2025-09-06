import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const _queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={_queryClient}>
		<App />
	</QueryClientProvider>,
);
