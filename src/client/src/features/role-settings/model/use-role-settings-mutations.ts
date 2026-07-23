import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	NameRequiredRequestBody,
	UpdateRoleSettingsRequest,
} from "juicer-shared";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { showRequestError } from "@/shared/notifications/show-request-error";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleSettings,
} from "../api/mutations";

interface MoveRoleInput {
	roleId: string;
	roleCategoryId: number | null;
}

interface SaveRoleSettingsInput {
	roleId: string;
	body: Required<
		Pick<
			UpdateRoleSettingsRequest,
			"roleCategoryId" | "selfAssignable" | "description"
		>
	>;
}

async function mutationSucceeded(mutation: Promise<unknown>) {
	try {
		await mutation;
		return true;
	} catch {
		return false;
	}
}

export function useRoleSettingsMutations(serverId: string) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();

	const createCategoryMutation = useMutation({
		mutationFn: (body: NameRequiredRequestBody) =>
			createRoleCategory({ serverId, body }),
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: serverQueryKeys.roleSettings(serverId),
			});
			enqueue("역할 분류를 추가했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const moveRoleMutation = useMutation({
		mutationFn: ({ roleId, roleCategoryId }: MoveRoleInput) =>
			updateRoleSettings({
				serverId,
				roleId,
				body: { roleCategoryId },
			}),
		onSuccess: async () => {
			await invalidateServerRoleState(queryClient, serverId);
			enqueue("역할을 옮겼습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const saveRoleSettingsMutation = useMutation({
		mutationFn: ({ roleId, body }: SaveRoleSettingsInput) =>
			updateRoleSettings({ serverId, roleId, body }),
		onSuccess: async () => {
			await invalidateServerRoleState(queryClient, serverId);
			enqueue("역할 설정을 저장했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const deleteCategoryMutation = useMutation({
		mutationFn: (roleCategoryId: number) =>
			deleteRoleCategory({ serverId, roleCategoryId }),
		onSuccess: async () => {
			await invalidateServerRoleState(queryClient, serverId);
			enqueue("역할 분류를 삭제했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});

	return {
		createCategory: (body: NameRequiredRequestBody) =>
			mutationSucceeded(createCategoryMutation.mutateAsync(body)),
		moveRole: (roleId: string, roleCategoryId: number | null) =>
			moveRoleMutation.mutate({ roleId, roleCategoryId }),
		saveRoleSettings: (roleId: string, body: SaveRoleSettingsInput["body"]) =>
			mutationSucceeded(saveRoleSettingsMutation.mutateAsync({ roleId, body })),
		deleteCategory: (roleCategoryId: number) =>
			mutationSucceeded(deleteCategoryMutation.mutateAsync(roleCategoryId)),
		isCreatingCategory: createCategoryMutation.isPending,
		isMovingRole: moveRoleMutation.isPending,
		isSavingRoleSettings: saveRoleSettingsMutation.isPending,
		isDeletingCategory: deleteCategoryMutation.isPending,
	};
}
