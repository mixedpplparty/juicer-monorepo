import { css } from "@emotion/react";

export const topicCategorySettingsStyles = {
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
	action: css({
		width: "100%",
		cursor: "pointer",
		"&:disabled": {
			color: "var(--md-sys-color-on-disabled)",
			cursor: "not-allowed",
		},
	}),
	addIcon: css({
		color: "var(--md-sys-color-primary)",
	}),
	deleteButton: css({
		"--jm3-button-container": "var(--md-sys-color-error)",
		"--jm3-button-label": "var(--md-sys-color-on-error)",
	}),
};
