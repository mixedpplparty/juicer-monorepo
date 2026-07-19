import { css } from "@emotion/react";

export const routeErrorBoundaryStyles = {
	root: css({
		display: "grid",
		minHeight: "100vh",
		padding: "1.5rem",
		placeContent: "center",
		textAlign: "center",
	}),
	content: css({
		display: "flex",
		maxWidth: "30rem",
		flexDirection: "column",
		alignItems: "center",
		gap: "0.75rem",
	}),
	title: css({
		margin: 0,
	}),
	message: css({
		margin: 0,
	}),
	retryButton: css({
		marginTop: "0.5rem",
	}),
};
