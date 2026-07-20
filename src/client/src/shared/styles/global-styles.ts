import { css } from "@emotion/react";
import breakpoints from "./breakpoints";

export const globalStyles = css`
	:root {
		font-family:
			"IBM Plex Sans KR", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

		background:
			radial-gradient(
				circle 50vw at 0% 0%,
				var(--md-sys-color-surface-container-highest),
				transparent 90%
			),
			radial-gradient(
				circle 50vw at 100% 100%,
				var(--md-sys-color-surface-container),
				transparent 90%
			),
			var(--md-sys-color-surface);
		background-attachment: fixed;

		@media (min-width: ${breakpoints.tablet}) {
			background:
				radial-gradient(
					circle 30vw at 100% 18%,
					var(--md-sys-color-surface-container-highest),
					transparent 90%
				),
				radial-gradient(
					circle 50vh at 45% 100%,
					var(--md-sys-color-surface-variant),
					transparent 90%
				),
				var(--md-sys-color-surface-container);
			background-attachment: fixed;
		}
	}

	html,
	body {
		min-height: 100%;
		margin: 0;
	}

	html,
	body,
	#root,
	#theme-provider-root {
		width: 100%;
		height: 100%;
	}
`;

export default globalStyles;
