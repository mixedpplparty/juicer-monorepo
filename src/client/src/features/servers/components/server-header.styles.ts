import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverHeaderStyles = {
	root: css({
		display: "flex",
		width: "100%",
		flexDirection: "column",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			flexDirection: "row",
			alignItems: "center",
			gap: "2rem",
		},
	}),
	searchRow: css({
		order: 0,
		display: "flex",
		height: "4rem",
		alignItems: "center",
		gap: "0.5rem",
		boxSizing: "border-box",
		"& > .jm3-search": {
			flex: "1 1 0",
			minWidth: 0,
		},
		[`@media (min-width: ${breakpoints.tablet})`]: {
			order: 1,
			flex: "0 1 40%",
			height: "auto",
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
		order: 1,
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
