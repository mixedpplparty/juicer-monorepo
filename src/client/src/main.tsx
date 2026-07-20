import App from "@/app/app";
import { queryClient } from "@/app/query-client";
import globalStyles from "@/shared/styles/global-styles";
import { Global } from "@emotion/react";
import { SnackbarProvider } from "@mixedpplparty/juicer-m3/snackbar";
import "@mixedpplparty/juicer-m3/styles.css";
import { ThemeProvider } from "@mixedpplparty/juicer-m3/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<Global styles={globalStyles} />
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme="system" id="theme-provider-root" scope="document">
				<SnackbarProvider>
					<App />
				</SnackbarProvider>
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
