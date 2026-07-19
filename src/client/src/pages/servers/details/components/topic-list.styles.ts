import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const topicListStyles = {
	list: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		padding: 0,
		"& > li": {
			minWidth: 0,
			display: "flex",
		},
		"& > li > .jm3-list-item": {
			flex: 1,
		},
		[`@media (min-width: ${breakpoints.tablet})`]: {
			display: "grid",
			gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		},
	}),
	item: css({
		"--jm3-list-item-container": "var(--md-sys-color-surface-container-high)",
		minWidth: 0,
		minHeight: 0,
		alignItems: "start",
		padding: "1rem",
		borderRadius: "0.5rem",
		cursor: "pointer",
		"& > span": {
			minWidth: 0,
		},
	}),
	details: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.125rem",
		color: "var(--md-sys-color-on-surface)",
	}),
	channels: css({
		minHeight: "var(--md-sys-typescale-body-medium-line-height)",
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: "0 0.5rem",
	}),
	roles: css({
		minHeight: "var(--md-sys-typescale-body-medium-line-height)",
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: "0 0.5rem",
	}),
	emptyAssociation: css({
		color: "var(--md-sys-color-on-surface-variant)",
		opacity: 0.72,
	}),
	status: css({
		margin: 0,
	}),
};
