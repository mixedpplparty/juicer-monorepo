import { css } from "@emotion/react";

export const verificationSettingsStyles = {
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
};
