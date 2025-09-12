import styled from "@emotion/styled";
import type { ToastProps } from "../../types/types";

export const Toast = styled.div<ToastProps>((props) => ({
	position: "absolute",
	bottom: "16px",
	left: "50%",
	right: "16px",
	maxWidth: "50%",
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
}));
