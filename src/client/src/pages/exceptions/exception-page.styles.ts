import { css } from "@emotion/react";

export const exceptionPageStyles = {
	fullPage: css({
		display: "flex",
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
	}),
	card: css({
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "1rem",
		padding: "2rem",
		textAlign: "center",
	}),
	icon: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "3.5rem",
		height: "3.5rem",
		borderRadius: "50%",
		color: "var(--md-sys-color-on-error-container)",
		backgroundColor: "var(--md-sys-color-error-container)",
		"& > svg": {
			width: "2rem",
			height: "2rem",
		},
	}),
	title: css({
		margin: 0,
	}),
	description: css({
		maxWidth: "25rem",
		margin: 0,
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	action: css({
		marginTop: "0.5rem",
		textDecoration: "none",
	}),
};
