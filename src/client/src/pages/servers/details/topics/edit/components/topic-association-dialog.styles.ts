import { css } from "@emotion/react";

export const topicAssociationDialogStyles = {
	content: css({
		minHeight: 0,
		maxHeight: "min(28rem, 60dvh)",
		overflowY: "auto",
	}),
	list: css({
		padding: 0,
		borderRadius: "1rem",
		overflow: "hidden",
	}),
	item: css({
		"--jm3-list-item-container": "var(--md-sys-color-surface-container-low)",
		cursor: "pointer",
		userSelect: "none",
		"& + &": {
			borderTop: "1px solid var(--md-sys-color-outline-variant)",
		},
		'&[aria-disabled="true"]': {
			color: "var(--md-sys-color-on-disabled)",
			cursor: "not-allowed",
		},
	}),
	empty: css({
		margin: 0,
		color: "var(--md-sys-color-on-surface-variant)",
	}),
};
