import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { syncServerRoles } from "@/features/server/api/mutations";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { useLoading } from "@/shared/async/use-loading";
import { showRequestError } from "@/shared/notifications/show-request-error";
export interface ServerDataSettingsProps {
	serverId: string;
}

function useServerDataSettingsModel({ serverId }: ServerDataSettingsProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [synchronizeRolesPending, withSynchronizeRoles] = useLoading();

	async function synchronizeRoles() {
		if (synchronizeRolesPending) return;
		await withSynchronizeRoles(async () => {
			try {
				const result = await syncServerRoles(serverId);

				await invalidateServerRoleState(queryClient, serverId);
				enqueue(
					`동기화했습니다. 추가 ${result.roles_created.length}개, 삭제 ${result.roles_deleted.length}개`,
				);
			} catch (error) {
				showRequestError(error, enqueue);
			}
		});
	}
	return {
		synchronizeRolesPending,
		synchronizeRoles,
	};
}
export type ServerDataSettingsViewModel = ReturnType<
	typeof useServerDataSettingsModel
>;
export function ServerDataSettingsPresenter({
	children,
	...props
}: ServerDataSettingsProps & {
	children: (model: ServerDataSettingsViewModel) => ReactNode;
}) {
	const model = useServerDataSettingsModel(props);
	return children(model);
}
