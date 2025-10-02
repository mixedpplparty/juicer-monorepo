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
		outline: "inherit",
		color: "inherit",
		cursor: props.loading || props.disabled ? "not-allowed" : "pointer",
		opacity: props.loading || props.disabled ? 0.5 : 1,
	}),
);

export const InlineButton = styled.button({
	display: "flex",
	background: "none",
	border: "none",
	font: "inherit",
	cursor: "pointer",
	outline: "inherit",
	color: "inherit",
	padding: 0,
});
