import { RefreshIcon } from "@mixedpplparty/juicer-m3/icons/refresh";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncServerRoles } from "@/pages/server-overview/api/mutations";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { showRequestError } from "@/shared/notifications/show-request-error";
import SettingsSection from "../components/settings-section";
import { serverDataSettingsStyles } from "./server-data-settings.styles";

interface ServerDataSettingsProps {
	serverId: string;
}

export function ServerDataSettings({ serverId }: ServerDataSettingsProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const mutation = useMutation({
		mutationFn: syncServerRoles,
		onSuccess: async (result) => {
			await invalidateServerRoleState(queryClient, serverId);
			enqueue(
				`동기화했습니다. 추가 ${result.roles_created.length}개, 삭제 ${result.roles_deleted.length}개`,
			);
		},
		onError: (error) => showRequestError(error, enqueue),
	});

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
							disabled={mutation.isPending}
							onClick={() => mutation.mutate(serverId)}
						/>
					}
					css={[serverDataSettingsStyles.item, serverDataSettingsStyles.action]}
					leading={
						mutation.isPending ? (
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
						mutation.isPending
							? "서버 데이터 동기화 중…"
							: "서버 데이터 강제 동기화"
					}
					supportingText="Discord의 최신 역할 정보를 juicer와 다시 맞춥니다."
				/>
			</List>
		</SettingsSection>
	);
}

export default ServerDataSettings;
