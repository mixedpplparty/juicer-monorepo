import styled from "@emotion/styled";

export const Skeleton = styled.div({
	width: "100%",
	height: "100%",
	backgroundColor: "rgba(255, 255, 255, 0.1)",
	animation: "skeleton-animation 1s linear infinite",
	"@keyframes skeleton-animation": {
		"0%": {
			backgroundColor: "rgba(255, 255, 255, 0.1)",
		},
		"50%": {
			backgroundColor: "rgba(255, 255, 255, 0.2)",
		},
		"100%": {
			backgroundColor: "rgba(255, 255, 255, 0.1)",
		},
	},
});
