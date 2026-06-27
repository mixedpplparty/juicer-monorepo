import styled from "@emotion/styled";

export const Button = styled.button(
	(props: { loading?: boolean; disabled?: boolean }) => ({
		borderRadius: "18px",
		boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.25)",
		paddingLeft: "16px",
		paddingRight: "16px",
		paddingTop: "9px",
		paddingBottom: "9px",
		border: "none",
		font: "inherit",
		color: "inherit",
		cursor: props.loading || props.disabled ? "not-allowed" : "pointer",
		opacity: props.loading || props.disabled ? 0.5 : 1,
		transition:
			"filter 0.15s ease-out, transform 0.1s ease-out, box-shadow 0.15s ease-out",
		// brightness-based states work over any background a caller sets (Discord
		// blue, danger red, translucent, or none) without overriding it.
		"&:hover:not(:disabled)": { filter: "brightness(1.12)" },
		"&:active:not(:disabled)": {
			filter: "brightness(0.96)",
			transform: "translateY(1px)",
		},
		"&:focus-visible": {
			outline: "2px solid rgba(255, 255, 255, 0.85)",
			outlineOffset: "2px",
		},
		"@media (prefers-reduced-motion: reduce)": { transition: "none" },
	}),
);

export const InlineButton = styled.button({
	display: "flex",
	background: "none",
	border: "none",
	font: "inherit",
	cursor: "pointer",
	color: "inherit",
	padding: 0,
	borderRadius: "4px",
	transition: "filter 0.15s ease-out",
	"&:hover:not(:disabled)": { filter: "brightness(1.25)" },
	"&:focus-visible": {
		outline: "2px solid rgba(255, 255, 255, 0.85)",
		outlineOffset: "2px",
	},
	"@media (prefers-reduced-motion: reduce)": { transition: "none" },
});
