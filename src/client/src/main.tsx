import { Global } from "@emotion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import _globalStyles from "./components/global-styles.tsx";
import "juicer-m3/styles.css";
import { ThemeProvider } from "juicer-m3";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Global styles={_globalStyles} />
		<ThemeProvider theme="light">
			<App />
		</ThemeProvider>
	</StrictMode>,
);
