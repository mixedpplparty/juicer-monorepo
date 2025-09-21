import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import type { ToastProps } from "juicer-shared";

const slideInAnimation = keyframes({
	from: {
		opacity: 0,
		transform: "translateX(100%)",
	},
	to: {
		opacity: 1,
		transform: "translateX(0)",
	},
});

export const Toast = styled.div<ToastProps>((props) => ({
	left: "50%",
	background:
		props.type === "error"
			? "#ed5555"
			: props.type === "success"
				? "#3ba85d"
				: props.type === "info"
					? "#212121"
					: "#212121",
	color: "white",
	padding: "16px",
	borderRadius: "16px",
	border: "1px solid rgba(255, 255, 255, 0.66)",
	zIndex: 4,
	animation: `${slideInAnimation} 0.3s ease-out forwards`,
	width: "100%",
	display: "flex",
	alignItems: "center",
}));
