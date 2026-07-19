import { useOutletContext } from "react-router";
import { ServerPageAppBar } from "../components/server-page-app-bar";
import type { ServerDetailsOutletContext } from "../server-details-context";
import { serverDetailsPageStyles } from "../server-details-page.styles";
import ServerSettingsContent from "./components/server-settings-content";

export function ServerSettingsPage() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();

	return (
		<>
			<ServerPageAppBar
				title="서버 설정"
				subtitle={`@${serverData.serverDataDiscord.name}`}
				backTo={`/servers/${serverId}`}
				backLabel="서버 상세로 돌아가기"
			/>
			<div css={serverDetailsPageStyles.content}>
				<ServerSettingsContent />
			</div>
		</>
	);
}

export default ServerSettingsPage;
