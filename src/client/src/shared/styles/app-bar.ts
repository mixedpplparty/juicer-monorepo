import { css } from "@emotion/react";
import breakpoints from "./breakpoints";

export const appBarStyles = {
	root: css({
		position: "sticky",
		top: 0,
		zIndex: 20,
		width: "100%",
		height: "4rem",
		minHeight: "4rem",
		boxSizing: "border-box",
		padding: "0 1rem",
		transition: "background-color 150ms ease",
		'&[data-scrolled="true"]': {
			backgroundColor: "var(--md-sys-color-surface)",
		},
	}),
	insetInServerPage: css({
		width: "calc(100% + 2rem)",
		margin: "-0.5rem -1rem 0",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			width: "100%",
			margin: 0,
			padding: 0,
		},
	}),
	desktopFullBleedInServerPage: css({
		[`@media (min-width: ${breakpoints.tablet})`]: {
			width: "calc(100% + 3rem)",
			marginInline: "-1.5rem",
			paddingInline: "1.5rem",
		},
	}),
};
