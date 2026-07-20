import { css } from "@emotion/react";

export const roleDropZoneStyles = {
	root: css({
		display: "flex",
		minInlineSize: 0,
		margin: 0,
		border: 0,
		flexDirection: "column",
		gap: "0.625rem",
		padding: "0.875rem 1rem 1rem",
		borderRadius: "1rem",
		backgroundColor: "var(--md-sys-color-surface-container-low)",
		transition: "background-color 150ms ease",
		'&[data-drag-over="true"]': {
			backgroundColor: "var(--md-sys-color-secondary-container)",
		},
	}),
	header: css({
		display: "flex",
		minWidth: 0,
		alignItems: "center",
		justifyContent: "space-between",
		gap: "0.75rem",
	}),
	name: css({
		margin: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
	chips: css({
		display: "flex",
		minHeight: "2rem",
		alignItems: "center",
		gap: "0.5rem",
		flexWrap: "wrap",
	}),
	chip: css({
		cursor: "grab",
		"&:active": {
			cursor: "grabbing",
		},
	}),
	empty: css({
		margin: 0,
		color: "var(--md-sys-color-on-surface-variant)",
	}),
};
