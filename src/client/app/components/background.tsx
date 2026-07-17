import { css } from "@emotion/react";
import { breakpoints } from "~/constants/breakpoints";

export const _Background = css`

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
`;

export default _Background;
