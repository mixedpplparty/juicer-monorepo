import { Link, useParams } from "react-router";
import { ServerInfo } from "../../components/dashboard/server-details";
import breakpoints from "../../constants/breakpoints";

export function ServerDetailsPage() {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return (
		<>
			<Link
				to="/servers"
				css={{
					display: "inline-block",
					padding: "1rem",
					[`@media (min-width: ${breakpoints.tablet})`]: {
						display: "none",
					},
				}}
			>
				← 서버 목록
			</Link>
			<ServerInfo serverId={serverId} />
		</>
	);
}

export default ServerDetailsPage;
