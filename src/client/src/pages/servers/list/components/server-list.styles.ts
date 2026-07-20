import { css } from "@emotion/react";

export const serverListStyles = {
	root: css({
		display: "flex",
		flexDirection: "column",
		height: "100dvh",
		minHeight: 0,
		position: "relative",
	}),
	scrollArea: css({
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		paddingBottom: "5.5rem",
	}),
	footer: css({
		position: "absolute",
		right: "1rem",
		bottom: "max(1rem, env(safe-area-inset-bottom))",
		left: "1rem",
		zIndex: 10,
	}),
	destructiveText: css({
		color: "var(--md-sys-color-error)",
	}),
	footerButton: css({
		width: "100%",
		justifyContent: "flex-start",
		paddingBlock: "0.75rem",
		borderRadius: "999px",
		backgroundColor: "var(--md-sys-color-surface)",
		boxShadow:
			"0 3px 8px color-mix(in srgb, var(--md-sys-color-shadow) 24%, transparent)",
	}),
	logoutError: css({
		margin: "1rem 1.5rem 0",
		color: "var(--md-sys-color-error)",
	}),
};
