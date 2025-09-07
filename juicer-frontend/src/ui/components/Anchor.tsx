import styled from "@emotion/styled";
import { Link } from "react-router";

export const AnchorNoStyle = styled.a({
	color: "inherit",
	textDecoration: "inherit",
  "&:focus, &:hover, &:visited, &:link, &:active": {
    textDecoration: "none",
  }
});

export const LinkNoStyle = styled(Link)({
  color: "inherit",
  textDecoration: "inherit",
  "&:focus, &:hover, &:visited, &:link, &:active": {
    textDecoration: "none",
  }
});