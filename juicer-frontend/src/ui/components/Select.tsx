import styled from "@emotion/styled";
export const Select = styled.select({
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
});

export const Option = styled.option({
	background: "#000",
	":nth-of-type(odd)": {
		background: "#000000",
	},
	":nth-of-type(even)": {
		background: "#222222",
	},
});
