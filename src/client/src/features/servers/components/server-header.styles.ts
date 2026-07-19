import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverHeaderStyles = {
	root: css({
		display: "contents",
		width: "100%",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			position: "sticky",
			top: 0,
			zIndex: 20,
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			gap: "2rem",
			transition: "background-color 150ms ease",
			'&[data-scrolled="true"]': {
				backgroundColor: "var(--md-sys-color-surface, var(--Schemes-Surface))",
			},
		},
	}),
	searchRow: css({
		order: 0,
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		"& > .jm3-search": {
			flex: "1 1 0",
			minWidth: 0,
		},
		[`@media (min-width: ${breakpoints.tablet})`]: {
			position: "static",
			order: 1,
			flex: "0 1 40%",
			minWidth: "20%",
			maxWidth: "30rem",
			marginLeft: "auto",
			padding: 0,
		},
	}),
	details: css({
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: "0.75rem",
		minWidth: 0,
		[`@media (min-width: ${breakpoints.tablet})`]: {
			order: 0,
			flex: "1 1 auto",
		},
	}),
	serverText: css({
		display: "flex",
		minWidth: 0,
		flex: "1 1 auto",
		flexDirection: "column",
		overflow: "hidden",
		"& > *": {
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
	}),
};
