import { Outlet } from "react-router";
import { serverDetailsPageStyles } from "./server-details-page.styles";

export function ServerDetailsLayout() {
	return (
		<div css={serverDetailsPageStyles.root}>
			<Outlet />
		</div>
	);
}

export default ServerDetailsLayout;
