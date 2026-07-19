import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverDetailsPageStyles = {
	root: css({
		width: "100%",
		height: "100%",
		boxSizing: "border-box",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			overflow: "hidden",
			borderRadius: "1rem 1rem 0 0",
			backgroundColor: "var(--Schemes-Surface)",
		},
	}),
};
