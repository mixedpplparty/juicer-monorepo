import styled from "@emotion/styled";

export const IconButton = styled.button`
	width: 40px;
	height: 40px;
	flex: none;
	padding: 0;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: inherit;
	cursor: pointer;
	place-items: center;

	&:hover {
		background: rgb(0 0 0 / 8%);
	}

	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
`;

export default IconButton;
