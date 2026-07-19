import { css } from "@emotion/react";
import breakpoints from "./breakpoints";

export const hideOnDesktop = css({
	[`@media (min-width: ${breakpoints.tablet})`]: {
		display: "none",
	},
});
