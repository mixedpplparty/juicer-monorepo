import { css } from "@emotion/react";
import breakpoints from "@/shared/styles/breakpoints";

export const serverSettingsPageStyles = {
	root: css({
		display: "flex",
		width: "100%",
		maxWidth: "48rem",
		margin: "-0.625rem auto 0",
		paddingBottom: "4rem",
		flexDirection: "column",
		gap: "2rem",
		[`@media (min-width: ${breakpoints.tablet})`]: {
			marginTop: 0,
		},
	}),
	section: css({
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
	}),
	sectionTitle: css({
		margin: 0,
		color: "var(--md-sys-color-primary)",
		paddingInline: "1rem",
	}),
};
