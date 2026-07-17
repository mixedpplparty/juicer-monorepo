import { Global } from "@emotion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import _globalStyles from "./components/global-styles.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Global styles={_globalStyles} />
		<App />
	</StrictMode>,
);
