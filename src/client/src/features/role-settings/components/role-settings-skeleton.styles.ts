import { css } from "@emotion/react";

export const roleSettingsSkeletonStyles = {
	root: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	group: css({
		display: "flex",
		minHeight: "5.75rem",
		flexDirection: "column",
		gap: "0.625rem",
		padding: "0.875rem 1rem 1rem",
		borderRadius: "1rem",
		backgroundColor: "var(--md-sys-color-surface-container-low)",
	}),
	groupName: css({
		width: "10rem",
		maxWidth: "55%",
		height: "1.25rem",
		borderRadius: "0.625rem",
	}),
	chips: css({
		display: "flex",
		minHeight: "2rem",
		alignItems: "center",
		gap: "0.5rem",
	}),
	chip: css({
		width: "5rem",
		height: "2rem",
		borderRadius: "1rem",
	}),
	shortChip: css({
		width: "3.75rem",
	}),
	action: css({
		display: "flex",
		minHeight: "4rem",
		padding: "0.75rem 1rem",
		alignItems: "center",
		gap: "0.75rem",
		borderRadius: "1rem",
		backgroundColor: "var(--md-sys-color-surface-container-low)",
	}),
	actionIcon: css({
		width: "1.5rem",
		height: "1.5rem",
		borderRadius: "50%",
	}),
	actionLabel: css({
		width: "9rem",
		height: "1rem",
		borderRadius: "0.5rem",
	}),
};
