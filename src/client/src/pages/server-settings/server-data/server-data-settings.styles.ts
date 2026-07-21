import { css } from "@emotion/react";

export const serverDataSettingsStyles = {
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
	progress: css({
		display: "inline-grid",
		width: "1.5rem",
		height: "1.5rem",
		placeItems: "center",
		"& .jm3-circular-progress": {
			width: "1.25rem",
			height: "1.25rem",
		},
	}),
};
