import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverSettingsPageStyles = {
	root: css({
		display: "flex",
		width: "100%",
		maxWidth: "48rem",
		margin: "-0.625rem auto 0",
		paddingBottom: "4rem",
		flexDirection: "column",
		gap: "2rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			marginTop: 0,
		},
	}),
	section: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	sectionTitle: css({
		margin: 0,
		color: "var(--md-sys-color-primary)",
		paddingInline: "1rem",
	}),
	list: css({
		margin: 0,
		padding: 0,
		overflow: "hidden",
		borderRadius: "1rem",
	}),
	item: css({
		"--jm3-list-item-container": "var(--md-sys-color-surface-container-low)",
		position: "relative",
		minBlockSize: "4rem",
		"& + &": {
			borderTop: "1px solid var(--md-sys-color-surface)",
		},
	}),
	actionItem: css({
		width: "100%",
		cursor: "pointer",
		"&:disabled": {
			color: "var(--md-sys-color-on-disabled)",
			cursor: "not-allowed",
		},
	}),
	rowAction: css({
		margin: "-0.5rem 0",
		padding: "0.5rem 0",
		border: 0,
		background: "transparent",
		color: "inherit",
		font: "inherit",
		textAlign: "start",
		cursor: "pointer",
		"&::before": {
			position: "absolute",
			inset: 0,
			content: '""',
		},
		"&:focus-visible": {
			outline: "none",
		},
		"&:focus-visible::before": {
			outline: "0.125rem solid var(--md-sys-color-primary)",
			outlineOffset: "-0.125rem",
		},
	}),
	trailingAction: css({
		position: "relative",
		zIndex: 1,
	}),
	addIcon: css({
		color: "var(--md-sys-color-primary)",
	}),
	emptyRoles: css({
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	roleGroups: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
	}),
	roleGroup: css({
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
	roleGroupHeader: css({
		display: "flex",
		minWidth: 0,
		alignItems: "center",
		justifyContent: "space-between",
		gap: "0.75rem",
	}),
	roleGroupName: css({
		margin: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
	roleChips: css({
		display: "flex",
		minHeight: "2rem",
		alignItems: "center",
		gap: "0.5rem",
		flexWrap: "wrap",
	}),
	roleChip: css({
		cursor: "grab",
		"&:active": {
			cursor: "grabbing",
		},
	}),
	roleGroupEmpty: css({
		margin: 0,
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	progressSlot: css({
		display: "inline-grid",
		width: "1.5rem",
		height: "1.5rem",
		placeItems: "center",
		"& .jm3-circular-progress": {
			width: "1.25rem",
			height: "1.25rem",
		},
	}),
	deleteButton: css({
		"--jm3-button-container": "var(--md-sys-color-error)",
		"--jm3-button-label": "var(--md-sys-color-on-error)",
	}),
};
