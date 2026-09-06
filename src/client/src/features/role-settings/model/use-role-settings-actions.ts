import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type { NameRequiredRequestBody } from "juicer-shared";
import type { RoleSettingsFormOutput } from "@/features/role-settings/model/role-settings-schema";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
import { showRequestError } from "@/shared/notifications/show-request-error";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleSettings,
} from "../api/mutations";

export function useRoleSettingsActions(
	serverId: string,
	refetchRoles: Refetch,
) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [isCreatingCategory, withCreating] = useLoading();
	const [isMovingRole, withMoving] = useLoading();
	const [isSavingRoleSettings, withSaving] = useLoading();
	const [isDeletingCategory, withDeleting] = useLoading();

	async function createCategory(body: NameRequiredRequestBody) {
		if (isCreatingCategory) return false;
		return withCreating(async () => {
			try {
				await createRoleCategory({ serverId, body });
				await refetchRoles();
				enqueue("역할 분류를 추가했습니다.");
				return true;
			} catch (error) {
				showRequestError(error, enqueue);
				return false;
			}
		});
	}
	async function moveRole(roleId: string, roleCategoryId: number | null) {
		if (isMovingRole) return;
		await withMoving(async () => {
			try {
				await updateRoleSettings({
					serverId,
					roleId,
					body: { roleCategoryId },
				});
				// Role metadata is also displayed in profiles and topics on other routes.
				await invalidateServerRoleState(queryClient, serverId);
				enqueue("역할을 옮겼습니다.");
			} catch (error) {
				showRequestError(error, enqueue);
			}
		});
	}
	async function saveRoleSettings(
		roleId: string,
		body: RoleSettingsFormOutput,
	) {
		if (isSavingRoleSettings) return false;
		return withSaving(async () => {
			try {
				await updateRoleSettings({ serverId, roleId, body });
				await invalidateServerRoleState(queryClient, serverId);
				enqueue("역할 설정을 저장했습니다.");
				return true;
			} catch (error) {
				showRequestError(error, enqueue);
				return false;
			}
		});
	}
	async function deleteCategory(roleCategoryId: number) {
		if (isDeletingCategory) return false;
		return withDeleting(async () => {
			try {
				await deleteRoleCategory({ serverId, roleCategoryId });
				await invalidateServerRoleState(queryClient, serverId);
				enqueue("역할 분류를 삭제했습니다.");
				return true;
			} catch (error) {
				showRequestError(error, enqueue);
				return false;
			}
		});
	}
	return {
		createCategory,
		moveRole,
		saveRoleSettings,
		deleteCategory,
		isCreatingCategory,
		isMovingRole,
		isSavingRoleSettings,
		isDeletingCategory,
	};
}
