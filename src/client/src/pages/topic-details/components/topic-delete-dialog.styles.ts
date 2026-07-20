import { css } from "@emotion/react";

export const topicDeleteDialogStyles = {
	trigger: css({
		color: "var(--md-sys-color-error)",
	}),
	confirmButton: css({
		"--jm3-button-container": "var(--md-sys-color-error)",
		"--jm3-button-label": "var(--md-sys-color-on-error)",
	}),
};
