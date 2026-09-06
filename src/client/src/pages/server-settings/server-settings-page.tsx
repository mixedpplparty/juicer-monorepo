import { useOutletContext } from "react-router";
import { serverDetailsPageStyles } from "@/features/server/components/server-layout.styles";
import { ServerPageAppBar } from "@/features/server/components/server-page-app-bar";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";
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
