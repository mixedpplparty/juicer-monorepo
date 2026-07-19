import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverDetailsPageStyles = {
	root: css({
		display: "flex",
		width: "100%",
		height: "100%",
		boxSizing: "border-box",
		flexDirection: "column",
		padding: "0.5rem 1rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			padding: "1.5rem",
			overflow: "hidden",
			borderRadius: "1rem 1rem 0 0",
			backgroundColor: "var(--Schemes-Surface)",
		},
	}),
	content: css({
		minWidth: 0,
		paddingTop: "1.5rem",
	}),
};
