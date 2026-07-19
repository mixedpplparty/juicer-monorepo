import { Global } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "juicer-m3";
import "juicer-m3/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/app";
import globalStyles from "@/shared/styles/global-styles";

const queryClient = new QueryClient();
const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<Global styles={globalStyles} />
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme="light" id="theme-provider-root">
				<App />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
