import styled from "@emotion/styled";
import { ArrowLeft } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useNavigate } from "react-router";
import IconButton from "./icon-button";

export interface AppBarProps extends ComponentPropsWithoutRef<"header"> {
	showBackButton?: boolean;
}

const Root = styled.header`
	display: flex;
	width: 100%;
	height: 64px;
	align-items: center;
	padding: 0 16px;
	column-gap: 14px;
`;

const Children = styled.div`
	display: flex;
	min-width: 0;
	flex: 1;
	align-items: center;
`;

export function AppBar({
	children,
	showBackButton = false,
	...headerProps
}: AppBarProps) {
	const navigate = useNavigate();

	return (
		<Root {...headerProps}>
			{showBackButton && (
				<IconButton
					type="button"
					aria-label="Go back"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft aria-hidden="true" size={24} />
				</IconButton>
			)}
			<Children>{children}</Children>
		</Root>
	);
}

export default AppBar;
