import { Global } from "@emotion/react";
import { ThemeProvider } from "juicer-m3";
import "juicer-m3/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import _globalStyles from "./components/global-styles.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Global styles={_globalStyles} />
		<ThemeProvider theme="light" id="theme-provider-root">
			<App />
		</ThemeProvider>
	</StrictMode>,
);
