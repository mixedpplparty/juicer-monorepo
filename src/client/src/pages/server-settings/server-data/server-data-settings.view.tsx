import { RefreshIcon } from "@mixedpplparty/juicer-m3/icons/refresh";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import SettingsSection from "../components/settings-section";
import type { ServerDataSettingsViewModel } from "./server-data-settings.presenter";
import { serverDataSettingsStyles } from "./server-data-settings.styles";
export function ServerDataSettingsView({
	synchronizeRolesPending,
	synchronizeRoles,
}: ServerDataSettingsViewModel) {
	return (
		<SettingsSection title="데이터">
			<List
				container="transparent"
				aria-label="서버 데이터"
				css={serverDataSettingsStyles.list}
			>
				<ListItem
					render={
						<button
							type="button"
							disabled={synchronizeRolesPending}
							onClick={() => void synchronizeRoles()}
						/>
					}
					css={[serverDataSettingsStyles.item, serverDataSettingsStyles.action]}
					leading={
						synchronizeRolesPending ? (
							<span css={serverDataSettingsStyles.progress}>
								<CircularProgress
									size={20}
									aria-label="서버 데이터 동기화 중"
								/>
							</span>
						) : (
							<RefreshIcon />
						)
					}
					headline={
						synchronizeRolesPending
							? "서버 데이터 동기화 중…"
							: "서버 데이터 강제 동기화"
					}
					supportingText="Discord의 최신 역할 정보를 juicer와 다시 맞춥니다."
				/>
			</List>
		</SettingsSection>
	);
}
