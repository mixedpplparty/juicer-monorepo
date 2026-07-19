import { css } from "@emotion/react";

export const roleSettingsDialogStyles = {
	form: css({
		display: "flex",
		minHeight: 0,
		flexDirection: "column",
		gap: "1.25rem",
	}),
	role: css({
		display: "flex",
		alignItems: "center",
	}),
	fields: css({
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
	}),
	fullWidth: css({
		width: "100%",
		"& > .jm3-select-field, & .jm3-select-trigger": {
			width: "100%",
		},
	}),
	switchRow: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "1rem",
	}),
	switchText: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.125rem",
	}),
	helper: css({
		color: "var(--md-sys-color-on-surface-variant)",
	}),
};
