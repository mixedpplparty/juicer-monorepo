import { css } from "@emotion/react";
import breakpoints from "./breakpoints";

export const globalStyles = css`
	:root {
		font-family:
			"IBM Plex Sans KR", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

		--Schemes-Surface-Container-Highest: #f0dfd8;
		--Schemes-Surface-Container: #fceae3;
		--Schemes-Surface-Variant: #f4ded4;
		--Schemes-Surface: #fff8f6;
		--Schemes-Primary-Fixed: #ffdbcb;
		--Schemes-Surface-Container-Low: #fff1eb;
		--Schemes-Outline-Variant: #d7c2b9;

		background:
			radial-gradient(
				circle 50vw at 0% 0%,
				var(--Schemes-Primary-Fixed),
				transparent 90%
			),
			radial-gradient(
				circle 50vw at 100% 100%,
				var(--Schemes-Surface-Container),
				transparent 90%
			),
			var(--Schemes-Surface);

		@media (min-width: ${breakpoints.tablet}) {
			background:
				radial-gradient(
					circle 30vw at 100% 18%,
					var(--Schemes-Surface-Container-Highest),
					transparent 90%
				),
				radial-gradient(
					circle 50vh at 45% 100%,
					var(--Schemes-Surface-Variant),
					transparent 90%
				),
				var(--Schemes-Surface-Container);
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
