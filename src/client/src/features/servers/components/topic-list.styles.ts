import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const topicListStyles = {
	list: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		padding: 0,
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
		display: "flex",
		flexWrap: "wrap",
		gap: "0 0.5rem",
	}),
	roles: css({
		display: "flex",
		flexWrap: "wrap",
		gap: "0 0.5rem",
	}),
	status: css({
		margin: 0,
	}),
};
