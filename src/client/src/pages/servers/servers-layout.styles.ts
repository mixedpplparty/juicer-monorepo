import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serversLayoutStyles = {
	root: css({
		display: "grid",
		minHeight: "100%",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			gridTemplateColumns: "20rem minmax(0, 1fr)",
		},
	}),
	content: css({
		minWidth: 0,
		[`@media (min-width: ${breakpoints.tablet})`]: {
			display: "block",
			overflow: "auto",
			boxSizing: "border-box",
			padding: "1rem 1rem 0",
		},
	}),
	contentHiddenOnMobile: css({
		display: "none",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			display: "block",
		},
	}),
};
