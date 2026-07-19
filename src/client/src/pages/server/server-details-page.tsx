import { AppBar } from "juicer-m3";
import { Link, useParams } from "react-router";
import { ServerInfo } from "../../components/dashboard/server-details";
import { hideOnDesktop } from "../../styles/styles";
import { serverDetailsContainerStyles } from "./styles";

export function ServerDetailsPage() {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return (
		<div css={serverDetailsContainerStyles}>
			<AppBar title="title"></AppBar>
			<Link
				to="/servers"
				css={[
					{
						display: "inline-block",
						padding: "1rem",
					},
					hideOnDesktop,
				]}
			>
				← 서버 목록
			</Link>
			<ServerInfo serverId={serverId} />
		</div>
	);
}

export default ServerDetailsPage;
