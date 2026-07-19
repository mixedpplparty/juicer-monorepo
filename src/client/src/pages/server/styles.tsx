import { css } from "@emotion/react";
import breakpoints from "../../constants/breakpoints";

export const serverDetailsContainerStyles = css`
	width: 100%;
	height: 100%;
	box-sizing: border-box;

	@media (min-width: ${breakpoints.tablet}) {
		overflow: hidden;
		border-radius: 16px 16px 0 0;
		background-color: var(--Schemes-Surface);
	}
`;
