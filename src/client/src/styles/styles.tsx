import { css } from "@emotion/react";
import breakpoints from "../constants/breakpoints";

export const fullCenteredPage = css({
	width: "100%",
	height: "100%",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
});

export const hideOnDesktop = css({
	[`@media (min-width: ${breakpoints.tablet})`]: {
		display: "none",
	},
});
