import { Global } from "@emotion/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider, ThemeProvider } from "juicer-m3";
import "juicer-m3/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/app";
import { queryClient } from "@/app/query-client";
import globalStyles from "@/shared/styles/global-styles";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<Global styles={globalStyles} />
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme="light" id="theme-provider-root">
				<SnackbarProvider>
					<App />
				</SnackbarProvider>
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
