import { css } from "@emotion/react";

export const roleSettingsSectionStyles = {
	groups: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
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
};
