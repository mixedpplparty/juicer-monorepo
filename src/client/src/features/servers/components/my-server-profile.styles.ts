import breakpoints from "@/shared/styles/breakpoints";
import { css } from "@emotion/react";

export const myServerProfileStyles = {
	root: css({
		display: "flex",
		width: "100%",
		flexDirection: "column",
		gap: "1rem",
	}),
	nicknameRow: css({
		display: "flex",
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: "0.5rem",
	}),
	roleGroups: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			flexDirection: "row",
			flexWrap: "wrap",
			alignItems: "flex-start",
		},
	}),
	roleGroup: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			maxWidth: "100%",
			flex: "0 0 auto",
		},
	}),
	roleGroupTitle: css({
		margin: 0,
	}),
	roles: css({
		display: "flex",
		flexWrap: "wrap",
		gap: "0.25rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			width: "max-content",
			maxWidth: "100%",
		},
	}),
	roleColor: css({
		width: "0.5rem",
		height: "0.5rem",
		flex: "none",
		borderRadius: "50%",
	}),
};
