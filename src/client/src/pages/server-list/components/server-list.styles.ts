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
};
