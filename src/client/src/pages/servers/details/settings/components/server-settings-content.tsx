import { Button, IconButton } from "@mixedpplparty/juicer-m3/button";
import { Chip } from "@mixedpplparty/juicer-m3/chip";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { RefreshIcon } from "@mixedpplparty/juicer-m3/icons/refresh";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Switch } from "@mixedpplparty/juicer-m3/switch";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role, RoleCategory, ServerData } from "juicer-shared";
import { type DragEvent, type ReactNode, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { queryKeys } from "@/constants/query-keys";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { syncServerRoles } from "../../api/mutations";
import type { ServerDetailsOutletContext } from "../../server-details-context";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleSettings,
	updateServerVerificationRequired,
} from "../api/mutations";
import RoleCategoryDialog from "./role-category-dialog";
import RoleSettingsDialog, {
	type RoleSettingsValue,
} from "./role-settings-dialog";
import { serverSettingsPageStyles } from "./server-settings-content.styles";
import TopicCategorySettings from "./topic-category-settings";

export function ServerSettingsContent() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();
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

	const refreshServerData = () =>
		queryClient.refetchQueries({
			queryKey: queryKeys.serverData(serverId),
		});
	const updateCachedRole = (updatedRole: Role) => {
		queryClient.setQueryData<ServerData>(
			queryKeys.serverData(serverId),
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

	const verificationMutation = useMutation({
		mutationFn: updateServerVerificationRequired,
		onSuccess: async () => {
			await refreshServerData();
			enqueue("서버 보안 설정을 변경했습니다.");
		},
		onError: (error) => showError(error, enqueue),
	});

	const syncMutation = useMutation({
		mutationFn: syncServerRoles,
		onSuccess: async (result) => {
			await invalidateServerRoleState(queryClient, serverId);
			enqueue(
				`동기화했습니다. 추가 ${result.roles_created.length}개, 삭제 ${result.roles_deleted.length}개`,
			);
		},
		onError: (error) => showError(error, enqueue),
	});

	const createCategoryMutation = useMutation({
		mutationFn: (name: string) => createRoleCategory({ serverId, name }),
		onSuccess: async () => {
			await refreshServerData();
			setCreatingCategory(false);
			enqueue("역할 분류를 추가했습니다.");
		},
		onError: (error) => showError(error, enqueue),
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
		onError: (error) => showError(error, enqueue),
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
		onError: (error) => showError(error, enqueue),
	});

	const deleteCategoryMutation = useMutation({
		mutationFn: deleteRoleCategory,
		onSuccess: async () => {
			await invalidateServerRoleState(queryClient, serverId);
			setPendingDelete(null);
			enqueue("역할 분류를 삭제했습니다.");
		},
		onError: (error) => showError(error, enqueue),
	});

	const verificationRequired =
		verificationMutation.isPending &&
		verificationMutation.variables !== undefined
			? verificationMutation.variables.verificationRequired
			: (serverData.serverDataDb?.verificationRequired ?? false);

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

	return (
		<div css={serverSettingsPageStyles.root}>
			<SettingsSection title="서버 보안">
				<List
					container="transparent"
					aria-label="서버 보안 설정"
					css={serverSettingsPageStyles.list}
				>
					<ListItem
						css={serverSettingsPageStyles.item}
						headline="특정 역할 보유자만 juicer 이용 가능"
						supportingText="켜면 아래 역할을 가진 멤버만 주제를 보고 역할을 받을 수 있습니다."
						trailing={
							<Switch
								checked={verificationRequired}
								disabled={verificationMutation.isPending}
								aria-label="특정 역할 보유자만 juicer 이용 가능"
								onCheckedChange={(checked) =>
									verificationMutation.mutate({
										serverId,
										verificationRequired: checked,
									})
								}
							/>
						}
					/>
				</List>
			</SettingsSection>

			<SettingsSection title="역할 설정">
				<div css={serverSettingsPageStyles.roleGroups}>
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
							roles={
								rolesByCategory.get(verificationCategory.roleCategoryId) ?? []
							}
							categoryKey={String(verificationCategory.roleCategoryId)}
							dragOverCategory={dragOverCategory}
							disabled={moveRoleMutation.isPending}
							onRoleClick={setSelectedRole}
							onDragStart={setDraggedRoleId}
							onDragOverCategory={setDragOverCategory}
							onDrop={(event) =>
								handleDrop(event, verificationCategory.roleCategoryId)
							}
						/>
					) : null}
					{visibleCategories.map((roleCategory) => (
						<RoleDropZone
							key={roleCategory.roleCategoryId}
							name={roleCategory.name}
							roles={rolesByCategory.get(roleCategory.roleCategoryId) ?? []}
							categoryKey={String(roleCategory.roleCategoryId)}
							dragOverCategory={dragOverCategory}
							disabled={moveRoleMutation.isPending}
							deleteAction={
								<IconButton
									type="button"
									aria-label={`${roleCategory.name} 역할 분류 삭제`}
									onClick={() => setPendingDelete(roleCategory)}
								>
									<DeleteIcon />
								</IconButton>
							}
							onRoleClick={setSelectedRole}
							onDragStart={setDraggedRoleId}
							onDragOverCategory={setDragOverCategory}
							onDrop={(event) => handleDrop(event, roleCategory.roleCategoryId)}
						/>
					))}
				</div>
				<List
					container="transparent"
					aria-label="역할 분류 추가"
					css={serverSettingsPageStyles.list}
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
							serverSettingsPageStyles.item,
							serverSettingsPageStyles.actionItem,
						]}
						leading={<AddIcon css={serverSettingsPageStyles.addIcon} />}
						headline="역할 분류 추가하기"
					/>
				</List>
			</SettingsSection>

			<SettingsSection title="주제 카테고리">
				<TopicCategorySettings
					serverId={serverId}
					categories={serverData.serverDataDb?.categories ?? []}
				/>
			</SettingsSection>

			<SettingsSection title="데이터">
				<List
					container="transparent"
					aria-label="서버 데이터"
					css={serverSettingsPageStyles.list}
				>
					<ListItem
						render={
							<button
								type="button"
								disabled={syncMutation.isPending}
								onClick={() => syncMutation.mutate(serverId)}
							/>
						}
						css={[
							serverSettingsPageStyles.item,
							serverSettingsPageStyles.actionItem,
						]}
						leading={
							syncMutation.isPending ? (
								<span css={serverSettingsPageStyles.progressSlot}>
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
							syncMutation.isPending
								? "서버 데이터 동기화 중…"
								: "서버 데이터 강제 동기화"
						}
						supportingText="Discord의 최신 역할 정보를 juicer와 다시 맞춥니다."
					/>
				</List>
			</SettingsSection>

			<RoleCategoryDialog
				open={creatingCategory}
				pending={createCategoryMutation.isPending}
				onOpenChange={setCreatingCategory}
				onSubmit={(name) => createCategoryMutation.mutate(name)}
			/>
			<RoleSettingsDialog
				role={selectedRole}
				categories={roleCategories.map((category) => ({
					id: category.roleCategoryId,
					name:
						category.roleCategoryId === 1
							? "juicer 이용에 필요한 역할"
							: category.name,
				}))}
				pending={roleSettingsMutation.isPending}
				onOpenChange={(open) => !open && setSelectedRole(null)}
				onSubmit={(value) => {
					if (selectedRole) {
						roleSettingsMutation.mutate({
							role: selectedRole,
							...value,
						});
					}
				}}
			/>
			<DeleteRoleCategoryDialog
				roleCategory={pendingDelete}
				pending={deleteCategoryMutation.isPending}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				onConfirm={() => {
					if (pendingDelete) {
						deleteCategoryMutation.mutate({
							serverId,
							roleCategoryId: pendingDelete.roleCategoryId,
						});
					}
				}}
			/>
		</div>
	);
}

interface RoleDropZoneProps {
	name: string;
	roles: RoleSettingsValue[];
	categoryKey: string;
	dragOverCategory: string | null;
	disabled: boolean;
	deleteAction?: ReactNode;
	onRoleClick: (role: RoleSettingsValue) => void;
	onDragStart: (roleId: string) => void;
	onDragOverCategory: (categoryKey: string) => void;
	onDrop: (event: DragEvent<HTMLElement>) => void;
}

function RoleDropZone({
	name,
	roles,
	categoryKey,
	dragOverCategory,
	disabled,
	deleteAction,
	onRoleClick,
	onDragStart,
	onDragOverCategory,
	onDrop,
}: RoleDropZoneProps) {
	return (
		<section
			aria-labelledby={`role-category-${categoryKey}`}
			css={serverSettingsPageStyles.roleGroup}
			data-drag-over={dragOverCategory === categoryKey}
			onDragEnter={() => !disabled && onDragOverCategory(categoryKey)}
			onDragOver={(event) => {
				if (!disabled) {
					event.preventDefault();
				}
			}}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) {
					onDragOverCategory("");
				}
			}}
			onDrop={onDrop}
		>
			<div css={serverSettingsPageStyles.roleGroupHeader}>
				<Text
					id={`role-category-${categoryKey}`}
					as="h3"
					typeRole="title"
					size="medium"
					css={serverSettingsPageStyles.roleGroupName}
				>
					{name}
				</Text>
				{deleteAction}
			</div>
			<div css={serverSettingsPageStyles.roleChips}>
				{roles.length > 0 ? (
					roles.map((role) => (
						<Chip
							key={role.id}
							type="button"
							variant="assist"
							draggable={!disabled}
							disabled={disabled}
							css={serverSettingsPageStyles.roleChip}
							onDragStart={(event) => {
								event.dataTransfer.setData("text/plain", role.id);
								event.dataTransfer.effectAllowed = "move";
								onDragStart(role.id);
							}}
							onDragEnd={() => onDragOverCategory("")}
							onClick={() => onRoleClick(role)}
						>
							<RoleIndicator
								roleName={role.name}
								color={role.color}
								typeRole="label"
								size="large"
							/>
						</Chip>
					))
				) : (
					<Text
						as="p"
						typeRole="body"
						size="small"
						css={serverSettingsPageStyles.roleGroupEmpty}
					>
						역할을 여기로 끌어다 놓으세요.
					</Text>
				)}
			</div>
		</section>
	);
}

function SettingsSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section css={serverSettingsPageStyles.section}>
			<Text
				as="h2"
				typeRole="label"
				size="large"
				css={serverSettingsPageStyles.sectionTitle}
			>
				{title}
			</Text>
			{children}
		</section>
	);
}

function DeleteRoleCategoryDialog({
	roleCategory,
	pending,
	onOpenChange,
	onConfirm,
}: {
	roleCategory: RoleCategory | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}) {
	return (
		<Dialog.Root
			open={roleCategory !== null}
			onOpenChange={(open) => !pending && onOpenChange(open)}
		>
			<Dialog.Popup>
				<Dialog.Title>역할 분류를 삭제할까요?</Dialog.Title>
				<Dialog.Description>
					‘{roleCategory?.name}’ 분류가 삭제되고, 이 분류의 역할은 미분류 상태로
					돌아갑니다.
				</Dialog.Description>
				<Dialog.Actions>
					<Button
						type="button"
						variant="text"
						disabled={pending}
						onClick={() => onOpenChange(false)}
					>
						취소
					</Button>
					<Button
						type="button"
						disabled={pending}
						css={serverSettingsPageStyles.deleteButton}
						onClick={onConfirm}
					>
						{pending ? "삭제 중…" : "삭제"}
					</Button>
				</Dialog.Actions>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function showError(
	error: unknown,
	enqueue: ReturnType<typeof useSnackbar>["enqueue"],
) {
	enqueue(
		error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
		{ title: "오류" },
	);
}

export default ServerSettingsContent;
