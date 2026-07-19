import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const topicEditPageStyles = {
	root: css({
		width: "100%",
		maxWidth: "48rem",
		margin: "-0.625rem auto 0",
		paddingBottom: "6rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			marginTop: 0,
		},
	}),
	form: css({
		display: "flex",
		flexDirection: "column",
		gap: "2rem",
	}),
	fields: css({
		display: "flex",
		flexDirection: "column",
		gap: "1.25rem",
		paddingInline: "0.375rem",
		"& > .jm3-field": {
			width: "100%",
		},
	}),
	section: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	sectionTitle: css({
		margin: 0,
	}),
	list: css({
		padding: 0,
		borderRadius: "1rem",
		overflow: "hidden",
	}),
	listItem: css({
		"--jm3-list-item-container": "var(--md-sys-color-surface-container-low)",
		minBlockSize: "2.75rem",
		padding: "0.625rem 0.5rem",
		"& + &": {
			borderTop: "1px solid var(--md-sys-color-surface)",
		},
	}),
	addItem: css({
		width: "100%",
		cursor: "pointer",
		"&:disabled": {
			color: "var(--md-sys-color-on-disabled)",
			cursor: "not-allowed",
		},
	}),
	fab: css({
		position: "fixed",
		zIndex: 10,
		right: "max(1rem, env(safe-area-inset-right))",
		bottom: "max(1rem, env(safe-area-inset-bottom))",
	}),
	fabIcon: css({
		width: "1.5rem",
		height: "1.5rem",
		flex: "0 0 1.5rem",
		display: "inline-grid",
		placeItems: "center",
		"& > svg, & > [role='progressbar']": {
			width: "1.5rem",
			height: "1.5rem",
		},
		"& .jm3-circular-progress": {
			width: "1.5rem",
			height: "1.5rem",
		},
	}),
	fabProgress: css({
		width: "1.5rem",
		height: "1.5rem",
		color: "currentColor",
	}),
};
