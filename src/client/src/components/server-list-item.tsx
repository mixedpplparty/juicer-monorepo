import styled from "@emotion/styled";
import type { ComponentPropsWithoutRef } from "react";

export type ServerListItemProps = ComponentPropsWithoutRef<"div">;

const Root = styled.div`
	display: flex;
	box-sizing: border-box;
	width: 100%;
	align-items: center;
	padding: 10px 16px;
	column-gap: 10px;
`;

export function ServerListItem({
	children,
	...rootProps
}: ServerListItemProps) {
	return <Root {...rootProps}>{children}</Root>;
}

export default ServerListItem;
