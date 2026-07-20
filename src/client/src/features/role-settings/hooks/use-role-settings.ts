import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role, RoleCategory, ServerData } from "juicer-shared";
import { type DragEvent, useMemo, useState } from "react";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { showRequestError } from "@/shared/notifications/show-request-error";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleSettings,
} from "../api/mutations";
import type { RoleSettingsValue } from "../components/role-settings-dialog";

interface UseRoleSettingsOptions {
	serverId: string;
	serverData: ServerData;
}

export function useRoleSettings({
	serverId,
	serverData,
}: UseRoleSettingsOptions) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [creatingCategory, setCreatingCategory] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleSettingsValue | null>(
		null,
	);
	const [pendingDelete, setPendingDelete] = useState<RoleCategory | null>(null);
	const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
	const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

	const dbRoles = serverData.serverDataDb?.roles ?? [];
	const roleCategories = serverData.serverDataDb?.roleCategories ?? [];
	const verificationCategory = roleCategories.find(
		(category) => category.roleCategoryId === 1,
	);
	const visibleCategories = roleCategories.filter(
		(category) => category.roleCategoryId !== 1,
	);
	const roles = useMemo<RoleSettingsValue[]>(() => {
		const dbRolesById = new Map(dbRoles.map((role) => [role.roleId, role]));
		return (serverData.serverDataDiscord.roles ?? []).flatMap((role) => {
			const dbRole = dbRolesById.get(role.id);
			if (!dbRole || role.name === "@everyone" || role.managed) {
				return [];
			}
			return [
				{
					id: role.id,
					name: role.name,
					color: role.color,
					roleCategoryId: dbRole.roleCategoryId,
					selfAssignable: dbRole.selfAssignable,
					description: dbRole.description,
				},
			];
		});
	}, [dbRoles, serverData.serverDataDiscord.roles]);
	const rolesByCategory = useMemo(() => {
		const result = new Map<number | null, RoleSettingsValue[]>();
		for (const role of roles) {
			const groupedRoles = result.get(role.roleCategoryId) ?? [];
			groupedRoles.push(role);
			result.set(role.roleCategoryId, groupedRoles);
		}
		return result;
	}, [roles]);

	const updateCachedRole = (updatedRole: Role) => {
		queryClient.setQueryData<ServerData>(
			serverQueryKeys.data(serverId),
			(current) => {
				if (!current?.serverDataDb?.roles) {
					return current;
				}
				return {
					...current,
					serverDataDb: {
						...current.serverDataDb,
						roles: current.serverDataDb.roles.map((role) =>
							role.roleId === updatedRole.roleId ? updatedRole : role,
						),
					},
				};
			},
		);
	};

	const createCategoryMutation = useMutation({
		mutationFn: (name: string) => createRoleCategory({ serverId, name }),
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: serverQueryKeys.data(serverId),
			});
			setCreatingCategory(false);
			enqueue("역할 분류를 추가했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const moveRoleMutation = useMutation({
		mutationFn: ({
			roleId,
			roleCategoryId,
		}: {
			roleId: string;
			roleCategoryId: number | null;
		}) => updateRoleSettings({ serverId, roleId, roleCategoryId }),
		onSuccess: async (updatedRole) => {
			updateCachedRole(updatedRole);
			await invalidateServerRoleState(queryClient, serverId);
			enqueue("역할을 옮겼습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
		onSettled: () => {
			setDraggedRoleId(null);
			setDragOverCategory(null);
		},
	});
	const roleSettingsMutation = useMutation({
		mutationFn: ({
			role,
			roleCategoryId,
			selfAssignable,
			description,
		}: {
			role: RoleSettingsValue;
			roleCategoryId: number | null;
			selfAssignable: boolean;
			description: string | null;
		}) =>
			updateRoleSettings({
				serverId,
				roleId: role.id,
				roleCategoryId,
				selfAssignable,
				description,
			}),
		onSuccess: async (updatedRole) => {
			updateCachedRole(updatedRole);
			setSelectedRole(null);
			await invalidateServerRoleState(queryClient, serverId);
			enqueue("역할 설정을 저장했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const deleteCategoryMutation = useMutation({
		mutationFn: deleteRoleCategory,
		onSuccess: async () => {
			await invalidateServerRoleState(queryClient, serverId);
			setPendingDelete(null);
			enqueue("역할 분류를 삭제했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});

	const handleDrop = (
		event: DragEvent<HTMLElement>,
		roleCategoryId: number | null,
	) => {
		event.preventDefault();
		const roleId = draggedRoleId || event.dataTransfer.getData("text/plain");
		const role = roles.find((candidate) => candidate.id === roleId);
		setDragOverCategory(null);
		if (
			!role ||
			role.roleCategoryId === roleCategoryId ||
			moveRoleMutation.isPending
		) {
			return;
		}
		moveRoleMutation.mutate({ roleId, roleCategoryId });
	};

	return {
		roleCategories,
		verificationCategory,
		visibleCategories,
		rolesByCategory,
		creatingCategory,
		setCreatingCategory,
		selectedRole,
		setSelectedRole,
		pendingDelete,
		setPendingDelete,
		dragOverCategory,
		setDragOverCategory,
		setDraggedRoleId,
		createCategoryMutation,
		moveRoleMutation,
		roleSettingsMutation,
		deleteCategoryMutation,
		handleDrop,
	};
}
