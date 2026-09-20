import { Suspense } from "react";
import { useOutletContext } from "react-router";
import {
	RoleSettingsSection,
	RoleSettingsSkeleton,
} from "@/features/role-settings";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";
import { TopicCategorySettings } from "@/features/topic-categories";
import ServerDataSettings from "../server-data/server-data-settings";
import VerificationSettings from "../verification/verification-settings";
import { serverSettingsPageStyles } from "./server-settings-content.styles";
import SettingsSection from "./settings-section";

export function ServerSettingsContent() {
	const { serverId, serverData, refetchServer } =
		useOutletContext<ServerDetailsOutletContext>();

	return (
		<div css={serverSettingsPageStyles.root}>
			<VerificationSettings
				refetchServer={refetchServer}
				serverId={serverId}
				verificationRequired={
					serverData.serverDataDb?.verificationRequired ?? false
				}
			/>
			<SettingsSection title="역할 설정">
				<Suspense fallback={<RoleSettingsSkeleton />}>
					<RoleSettingsSection serverId={serverId} />
				</Suspense>
			</SettingsSection>
			<SettingsSection title="주제 카테고리">
				<TopicCategorySettings
					refetchServer={refetchServer}
					serverId={serverId}
					categories={serverData.serverDataDb?.categories ?? []}
				/>
			</SettingsSection>
			<ServerDataSettings serverId={serverId} />
		</div>
	);
}

export default ServerSettingsContent;
