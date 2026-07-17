import styled from "@emotion/styled";
import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ClickableListItemProps<T extends ElementType = "div"> = {
	as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

const Root = styled.div`
	display: flex;
	box-sizing: border-box;
	width: 100%;
	align-items: center;
	padding: 10px;
	border-radius: 0;
	background-color: var(--Schemes-Surface-Container-Low);
	color: inherit;
	text-decoration: none;
	cursor: pointer;

	&:first-child {
		border-radius: 8px 8px 0 0;
	}

	&:last-child {
		border-radius: 0 0 8px 8px;
	}

	&:only-child {
		border-radius: 8px;
	}
`;

export function ClickableListItem<T extends ElementType = "div">({
	as,
	...rootProps
}: ClickableListItemProps<T>) {
	return <Root as={as} {...rootProps} />;
}

export default ClickableListItem;
