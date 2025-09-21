import styled from "@emotion/styled";

export const Spinner = styled.div({
	width: "64px",
	height: "64px",
	border: "6px solid rgba(255, 255, 255, 0.5)",
	boxSizing: "border-box",
	borderRadius: "100%",
	borderTopColor: "rgba(255, 255, 255, 1)",
	animation: "spin 1s linear infinite",
	"@keyframes spin": {
		to: {
			transform: "rotate(360deg)",
		},
	},
});
