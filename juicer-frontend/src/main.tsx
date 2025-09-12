import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ToastProvider from "./hooks/useToast";

const _queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={_queryClient}>
		<ToastProvider>
			<App />
		</ToastProvider>
	</QueryClientProvider>,
);
