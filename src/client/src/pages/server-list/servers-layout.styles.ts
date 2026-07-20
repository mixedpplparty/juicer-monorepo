import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serversLayoutStyles = {
	root: css({
		display: "grid",
		minHeight: "100%",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			height: "100%",
			minHeight: 0,
			gridTemplateColumns: "20rem minmax(0, 1fr)",
			overflow: "hidden",
		},
	}),
	content: css({
		minWidth: 0,
		[`@media (min-width: ${breakpoints.tablet})`]: {
			display: "block",
			minHeight: 0,
			overflowX: "hidden",
			overflowY: "auto",
			boxSizing: "border-box",
			padding: "0 1rem",
		},
	}),
	contentHiddenOnMobile: css({
		display: "none",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			display: "block",
		},
	}),
};
