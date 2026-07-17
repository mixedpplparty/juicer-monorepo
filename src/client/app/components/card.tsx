import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { ComponentPropsWithoutRef } from "react";

export type CardVariant = "outlined" | "filled" | "elevated";

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
	variant?: CardVariant;
}

const universalStyles = css`
  display: flex;
  padding: 10px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;

`;

const variantStyles: Record<CardVariant, ReturnType<typeof css>> = {
	outlined: css`
		border: 1px solid var(--Schemes-Outline-Variant);
		background-color: var(--Schemes-Surface);
	`,
	filled: css`
		border: 0;
		background-color: var(--Schemes-Surface-Container-Low);
	`,
	elevated: css`
		border: 0;
		background-color: var(--Schemes-Surface-Container-Highest);
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.30), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
	`,
};

const Root = styled.div<{ $variant: CardVariant }>`
	${universalStyles}
	${({ $variant }) => variantStyles[$variant]}
`;

export function Card({
	variant = "outlined",
	children,
	...rootProps
}: CardProps) {
	return (
		<Root $variant={variant} {...rootProps}>
			{children}
		</Root>
	);
}

export default Card;
