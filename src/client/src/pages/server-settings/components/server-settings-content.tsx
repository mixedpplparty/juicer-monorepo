import { useOutletContext } from "react-router";
import { RoleSettingsSection } from "@/features/role-settings";
import { TopicCategorySettings } from "@/features/topic-categories";
import type { ServerDetailsOutletContext } from "@/pages/server-overview/server-details-context";
import ServerDataSettings from "../server-data/server-data-settings";
import VerificationSettings from "../verification/verification-settings";
import { serverSettingsPageStyles } from "./server-settings-content.styles";
import SettingsSection from "./settings-section";

export function ServerSettingsContent() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();

	return (
		<div css={serverSettingsPageStyles.root}>
			<VerificationSettings
				serverId={serverId}
				verificationRequired={
					serverData.serverDataDb?.verificationRequired ?? false
				}
			/>
			<SettingsSection title="역할 설정">
				<RoleSettingsSection serverId={serverId} serverData={serverData} />
			</SettingsSection>
			<SettingsSection title="주제 카테고리">
				<TopicCategorySettings
					serverId={serverId}
					categories={serverData.serverDataDb?.categories ?? []}
				/>
			</SettingsSection>
			<ServerDataSettings serverId={serverId} />
		</div>
	);
}

export default ServerSettingsContent;
