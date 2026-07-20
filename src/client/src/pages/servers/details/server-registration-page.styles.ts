import { css } from "@emotion/react";

export const serverRegistrationPageStyles = {
	root: css({
		display: "flex",
		minHeight: "100%",
		boxSizing: "border-box",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "1.5rem",
		padding: "2rem",
		textAlign: "center",
	}),
	copy: css({
		display: "flex",
		maxWidth: "32rem",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	description: css({
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	error: css({
		maxWidth: "32rem",
		color: "var(--md-sys-color-error)",
	}),
};
