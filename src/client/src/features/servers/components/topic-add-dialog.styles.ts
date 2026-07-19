import { css } from "@emotion/react";

export const topicAddDialogStyles = {
	form: css({
		display: "flex",
		flexDirection: "column",
		gap: "1.5rem",
	}),
	fields: css({
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
	}),
	categoryField: css({
		width: "100%",
		"& > .jm3-select-field, & .jm3-select-trigger": {
			width: "100%",
		},
	}),
	error: css({
		margin: 0,
		color: "var(--md-sys-color-error)",
	}),
};
