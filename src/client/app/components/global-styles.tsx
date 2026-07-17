import { css } from "@emotion/react";
import { breakpoints } from "~/constants/breakpoints";

export const _globalStyles = css`
	:root {
		font-family:
			"IBM Plex Sans KR", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

    --Schemes-Surface-Container-Highest: #F0DFD8;
    --Schemes-Surface-Container: #FCEAE3;
    --Schemes-Surface-Variant: #F4DED4;
    --Schemes-Surface: #FFF8F6;
    --Schemes-Primary-Fixed: #FFDBCB;

    background: 
      radial-gradient(
        circle 50vw at 0% 0%,
        var(--Schemes-Primary-Fixed),
        transparent 90%
      ),
      radial-gradient(
        circle 50vw at 100% 100%,
        var(--Schemes-Surface-Container),
        transparent 90%
      ),
      var(--Schemes-Surface);

      @media (min-width: ${breakpoints.tablet}) {
        background: 
          radial-gradient(
            circle 30vw at 100% 18%,
            var(--Schemes-Surface-Container-Highest),
            transparent 90%
          ),
          radial-gradient(
            circle 50vh at 45% 100%,
            var(--Schemes-Surface-Variant),
            transparent 90%
          ),
          var(--Schemes-Surface-Container);

      }
	}

	html,
	body {
		min-height: 100%;
		margin: 0;
	}

`;

export default _globalStyles;
