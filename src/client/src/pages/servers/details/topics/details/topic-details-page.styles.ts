import { css } from "@emotion/react";

export const topicDetailsPageStyles = {
	root: css({
		width: "100%",
		maxWidth: "48rem",
		margin: "0 auto",
		display: "flex",
		flexDirection: "column",
		gap: "1.5rem",
	}),
	details: css({
		display: "flex",
		margin: 0,
		flexDirection: "column",
		gap: "1.5rem",
	}),
	field: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem",
	}),
	label: css({
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	detailValue: css({
		margin: 0,
	}),
	value: css({
		margin: 0,
	}),
	channels: css({
		display: "flex",
		flexWrap: "wrap",
		gap: "0.25rem 0.75rem",
	}),
	roles: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	rolesTitle: css({
		margin: 0,
	}),
	roleList: css({
		padding: 0,
		borderRadius: "1rem",
		overflow: "hidden",
	}),
	roleItem: css({
		"--jm3-list-item-container": "var(--md-sys-color-surface-container-low)",
		minHeight: "3.75rem",
		cursor: "pointer",
		"& + &": {
			borderTop: "1px solid var(--md-sys-color-outline-variant)",
		},
	}),
	roleItemDisabled: css({
		cursor: "not-allowed",
	}),
	roleControl: css({
		width: "3rem",
		height: "3rem",
		display: "grid",
		placeItems: "center",
	}),
	emptyRoles: css({
		margin: 0,
		padding: "1rem",
		borderRadius: "1rem",
		background: "var(--md-sys-color-surface-container-low)",
		color: "var(--md-sys-color-on-surface-variant)",
	}),
	appBarTitle: css({
		minWidth: 0,
		display: "flex",
		flexDirection: "column",
	}),
	appBarTopicName: css({
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
	appBarServerName: css({
		color: "var(--md-sys-color-on-surface-variant)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	}),
};
