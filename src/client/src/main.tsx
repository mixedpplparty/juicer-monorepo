import { Global } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "juicer-m3";
import "juicer-m3/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import _globalStyles from "./styles/global.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Global styles={_globalStyles} />
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme="light" id="theme-provider-root">
				<App />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
