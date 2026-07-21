import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const loadingSkeletonStyles = {
	status: css({
		width: "100%",
	}),
	line: css({
		height: "1rem",
		borderRadius: "0.5rem",
	}),
	titleLine: css({
		width: "min(14rem, 55vw)",
		height: "1.5rem",
		borderRadius: "0.75rem",
	}),
	shortLine: css({
		width: "7rem",
		height: "0.75rem",
		borderRadius: "0.375rem",
	}),
	mediumLine: css({
		width: "12rem",
		maxWidth: "70%",
		height: "1rem",
		borderRadius: "0.5rem",
	}),
	circle: css({
		width: "2.5rem",
		height: "2.5rem",
		flex: "0 0 2.5rem",
		borderRadius: "50%",
	}),
	serverList: css({
		padding: 0,
	}),
	serverListItem: css({
		minHeight: "4.5rem",
	}),
	appBarTitle: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.375rem",
	}),
	headerSearch: css({
		height: "3rem",
		flex: "1 1 0",
		minWidth: 0,
		borderRadius: "1.5rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			flex: "0 1 40%",
			minWidth: "20%",
			maxWidth: "30rem",
			marginLeft: "auto",
		},
	}),
	serverDetails: css({
		display: "flex",
		minWidth: 0,
		flex: "1 1 auto",
		alignItems: "center",
		gap: "0.75rem",
	}),
	serverText: css({
		display: "flex",
		minWidth: 0,
		flex: 1,
		flexDirection: "column",
		gap: "0.5rem",
	}),
	sectionHeading: css({
		width: "8rem",
		height: "1.5rem",
		borderRadius: "0.75rem",
	}),
	profileCard: css({
		display: "flex",
		width: "100%",
		flexDirection: "column",
		gap: "1rem",
	}),
	profileRow: css({
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
	}),
	chips: css({
		display: "flex",
		gap: "0.5rem",
		flexWrap: "wrap",
	}),
	chip: css({
		width: "5rem",
		height: "2rem",
		borderRadius: "1rem",
	}),
	topicGrid: css({
		display: "grid",
		gridTemplateColumns: "1fr",
		gap: "0.75rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		},
	}),
	topicCard: css({
		display: "flex",
		minHeight: "6.5rem",
		padding: "1rem",
		flexDirection: "column",
		gap: "0.75rem",
		borderRadius: "0.5rem",
		background: "var(--md-sys-color-surface-container-high)",
	}),
	page: css({
		display: "flex",
		width: "100%",
		maxWidth: "48rem",
		margin: "0 auto",
		flexDirection: "column",
		gap: "1.5rem",
	}),
	field: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	listSurface: css({
		display: "flex",
		overflow: "hidden",
		flexDirection: "column",
		borderRadius: "1rem",
		background: "var(--md-sys-color-surface-container-low)",
	}),
	listRow: css({
		display: "flex",
		minHeight: "4rem",
		padding: "0.75rem 1rem",
		alignItems: "center",
		gap: "0.75rem",
		"& + &": {
			borderTop: "1px solid var(--md-sys-color-surface)",
		},
	}),
	settingsSection: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	input: css({
		width: "100%",
		height: "3.5rem",
		borderRadius: "0.25rem 0.25rem 0 0",
	}),
};
