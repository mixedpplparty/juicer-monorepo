import { css } from "@emotion/react";

export const adminFabMenuStyles = {
	root: css({
		position: "fixed",
		zIndex: 10,
		right: "max(1rem, env(safe-area-inset-right))",
		bottom: "max(1rem, env(safe-area-inset-bottom))",
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-end",
		gap: "0.75rem",
	}),
	menu: css({
		"& > div": {
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-end",
			gap: "0.75rem",
		},
	}),
};
