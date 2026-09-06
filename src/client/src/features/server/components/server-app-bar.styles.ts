import { css } from "@emotion/react";
export const serverAppBarStyles = {
	title: css({ minWidth: 0, display: "flex", flexDirection: "column" }),
	name: css({
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
	subtitle: css({
		color: "var(--md-sys-color-on-surface-variant)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
};
