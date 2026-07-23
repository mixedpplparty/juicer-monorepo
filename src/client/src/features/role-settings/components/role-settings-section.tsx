import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type {
	NameRequiredRequestBody,
	RoleSettingsCategory,
	RoleSettingsRole,
} from "juicer-shared";
import { type DragEvent, useMemo, useState } from "react";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { showRequestError } from "@/shared/notifications/show-request-error";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleSettings,
} from "../api/mutations";
import { roleSettingsQueryOptions } from "../api/queries";
import DeleteRoleCategoryDialog from "./delete-role-category-dialog";
import RoleCategoryDialog from "./role-category-dialog";
import RoleDropZone from "./role-drop-zone";
import RoleSettingsDialog from "./role-settings-dialog";
import { roleSettingsSectionStyles } from "./role-settings-section.styles";

interface RoleSettingsSectionProps {
	serverId: string;
}

export function RoleSettingsSection({ serverId }: RoleSettingsSectionProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const { data: roleSettings } = useSuspenseQuery(
		roleSettingsQueryOptions(serverId),
	);
	const [creatingCategory, setCreatingCategory] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleSettingsRole | null>(
		null,
	);
	const [pendingDelete, setPendingDelete] =
		useState<RoleSettingsCategory | null>(null);
	const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
	const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

	const verificationCategory = roleSettings.categories.find(
		(category) => category.kind === "verification",
	);
	const visibleCategories = roleSettings.categories.filter(
		(category) => category.kind !== "verification",
	);
	const rolesByCategory = useMemo(() => {
		const result = new Map<number | null, RoleSettingsRole[]>();
		for (const role of roleSettings.roles) {
			const groupedRoles = result.get(role.categoryId) ?? [];
			groupedRoles.push(role);
			result.set(role.categoryId, groupedRoles);
		}
		return result;
	}, [roleSettings.roles]);

	const createCategoryMutation = useMutation({
		mutationFn: (body: NameRequiredRequestBody) =>
			createRoleCategory({ serverId, body }),
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: serverQueryKeys.roleSettings(serverId),
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
		}) =>
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
			role: RoleSettingsRole;
			roleCategoryId: number | null;
			selfAssignable: boolean;
			description: string | null;
		}) =>
			updateRoleSettings({
				serverId,
				roleId: role.id,
				body: {
					roleCategoryId,
					selfAssignable,
					description,
				},
			}),
		onSuccess: async () => {
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
		const role = roleSettings.roles.find(
			(candidate) => candidate.id === roleId,
		);
		setDragOverCategory(null);
		if (
			!role?.editable ||
			role.categoryId === roleCategoryId ||
			moveRoleMutation.isPending
		) {
			return;
		}
		moveRoleMutation.mutate({ roleId, roleCategoryId });
	};

	return (
		<>
			<div css={roleSettingsSectionStyles.groups}>
				<RoleDropZone
					name="분류 없는 역할"
					roles={rolesByCategory.get(null) ?? []}
					categoryKey="unassigned"
					dragOverCategory={dragOverCategory}
					disabled={moveRoleMutation.isPending}
					onRoleClick={setSelectedRole}
					onDragStart={setDraggedRoleId}
					onDragOverCategory={setDragOverCategory}
					onDrop={(event) => handleDrop(event, null)}
				/>
				{verificationCategory ? (
					<RoleDropZone
						name="juicer 이용에 필요한 역할"
						roles={rolesByCategory.get(verificationCategory.id) ?? []}
						categoryKey={String(verificationCategory.id)}
						dragOverCategory={dragOverCategory}
						disabled={moveRoleMutation.isPending}
						onRoleClick={setSelectedRole}
						onDragStart={setDraggedRoleId}
						onDragOverCategory={setDragOverCategory}
						onDrop={(event) => handleDrop(event, verificationCategory.id)}
					/>
				) : null}
				{visibleCategories.map((roleCategory) => (
					<RoleDropZone
						key={roleCategory.id}
						name={roleCategory.name}
						roles={rolesByCategory.get(roleCategory.id) ?? []}
						categoryKey={String(roleCategory.id)}
						dragOverCategory={dragOverCategory}
						disabled={moveRoleMutation.isPending}
						deleteAction={
							roleCategory.deletable ? (
								<IconButton
									type="button"
									aria-label={`${roleCategory.name} 역할 분류 삭제`}
									onClick={() => setPendingDelete(roleCategory)}
								>
									<DeleteIcon />
								</IconButton>
							) : undefined
						}
						onRoleClick={setSelectedRole}
						onDragStart={setDraggedRoleId}
						onDragOverCategory={setDragOverCategory}
						onDrop={(event) => handleDrop(event, roleCategory.id)}
					/>
				))}
			</div>
			<List
				container="transparent"
				aria-label="역할 분류 추가"
				css={roleSettingsSectionStyles.list}
			>
				<ListItem
					render={
						<button
							type="button"
							disabled={createCategoryMutation.isPending}
							onClick={() => setCreatingCategory(true)}
						/>
					}
					css={[
						roleSettingsSectionStyles.item,
						roleSettingsSectionStyles.action,
					]}
					leading={<AddIcon css={roleSettingsSectionStyles.addIcon} />}
					headline="역할 분류 추가하기"
				/>
			</List>

			<RoleCategoryDialog
				key={creatingCategory ? "open" : "closed"}
				open={creatingCategory}
				pending={createCategoryMutation.isPending}
				onOpenChange={setCreatingCategory}
				onSubmit={(body) => createCategoryMutation.mutate(body)}
			/>
			{selectedRole ? (
				<RoleSettingsDialog
					role={selectedRole}
					categories={roleSettings.categories.map((category) => ({
						id: category.id,
						name:
							category.kind === "verification"
								? "juicer 이용에 필요한 역할"
								: category.name,
					}))}
					pending={roleSettingsMutation.isPending}
					onOpenChange={(open) => !open && setSelectedRole(null)}
					onSubmit={(value) =>
						roleSettingsMutation.mutate({
							role: selectedRole,
							...value,
						})
					}
				/>
			) : null}
			<DeleteRoleCategoryDialog
				roleCategory={pendingDelete}
				pending={deleteCategoryMutation.isPending}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				onConfirm={() => {
					if (pendingDelete) {
						deleteCategoryMutation.mutate({
							serverId,
							roleCategoryId: pendingDelete.id,
						});
					}
				}}
			/>
		</>
	);
}

export default RoleSettingsSection;
