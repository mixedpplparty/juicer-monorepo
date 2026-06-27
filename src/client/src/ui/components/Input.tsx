import styled from "@emotion/styled";
export const Input = styled.input({
	padding: "8px",
	borderRadius: "8px",
	borderBottom: "1px solid rgba(255, 255, 255, 0.66)",
	borderTop: "none",
	borderLeft: "none",
	borderRight: "none",
	background: "rgba(255,255,255,0.1)",
	outline: "none",
	WebkitAppearance: "none",
	color: "#fff",
	transition:
		"background 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out",
	"::placeholder": { color: "rgba(255, 255, 255, 0.66)" },
	// outline:none removed the only focus cue; restore a visible one (AA keyboard).
	"&:focus": {
		borderBottomColor: "#fff",
		background: "rgba(255, 255, 255, 0.16)",
		boxShadow: "0 1px 0 0 rgba(255, 255, 255, 0.5)",
	},
	"@media (prefers-reduced-motion: reduce)": { transition: "none" },
});
