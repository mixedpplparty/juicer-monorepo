import styled from "@emotion/styled";

export const Card = styled.div({
	borderRadius: "16px",
	border: "1px solid rgba(0, 0, 0, 0.66)",
	background: "rgba(0, 0, 0, 0.75)",
	backdropFilter: "blur(21px)",
	filter: "drop-shadow(0 4px 4px rgba(0, 0, 0, 0.15))",
	color: "white",
	padding: "16px",
	display: "flex",
	flexDirection: "column",
	gap: " 8px",
	maxHeight: "100%",
	maxWidth: "100%",
});

//with responsive width
//width 100% for portrait, 70% for landscape
export const ResponsiveCard = styled.div({
	borderRadius: "16px",
	border: "1px solid rgba(0, 0, 0, 0.66)",
	background: "rgba(0, 0, 0, 0.75)",
	backdropFilter: "blur(21px)",
	filter: "drop-shadow(0 4px 4px rgba(0, 0, 0, 0.15))",
	color: "white",
	padding: "16px",
	display: "flex",
	flexDirection: "column",
	minWidth: "70%",
	maxHeight: "100%",
	maxWidth: "100%",
	"@media (max-aspect-ratio: 1/1)": {
		width: "100%",
	},
});
