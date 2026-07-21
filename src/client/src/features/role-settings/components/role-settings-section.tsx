import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import type { ServerData } from "juicer-shared";
import { useRoleSettings } from "../hooks/use-role-settings";
import DeleteRoleCategoryDialog from "./delete-role-category-dialog";
import RoleCategoryDialog from "./role-category-dialog";
import RoleDropZone from "./role-drop-zone";
import RoleSettingsDialog from "./role-settings-dialog";
import { roleSettingsSectionStyles } from "./role-settings-section.styles";

interface RoleSettingsSectionProps {
	serverId: string;
	serverData: ServerData;
}

export function RoleSettingsSection({
	serverId,
	serverData,
}: RoleSettingsSectionProps) {
	const settings = useRoleSettings({ serverId, serverData });

	return (
		<>
			<div css={roleSettingsSectionStyles.groups}>
				<RoleDropZone
					name="분류 없는 역할"
					roles={settings.rolesByCategory.get(null) ?? []}
					categoryKey="unassigned"
					dragOverCategory={settings.dragOverCategory}
					disabled={settings.moveRoleMutation.isPending}
					onRoleClick={settings.setSelectedRole}
					onDragStart={settings.setDraggedRoleId}
					onDragOverCategory={settings.setDragOverCategory}
					onDrop={(event) => settings.handleDrop(event, null)}
				/>
				{settings.verificationCategory ? (
					<RoleDropZone
						name="juicer 이용에 필요한 역할"
						roles={
							settings.rolesByCategory.get(
								settings.verificationCategory.roleCategoryId,
							) ?? []
						}
						categoryKey={String(settings.verificationCategory.roleCategoryId)}
						dragOverCategory={settings.dragOverCategory}
						disabled={settings.moveRoleMutation.isPending}
						onRoleClick={settings.setSelectedRole}
						onDragStart={settings.setDraggedRoleId}
						onDragOverCategory={settings.setDragOverCategory}
						onDrop={(event) =>
							settings.handleDrop(
								event,
								settings.verificationCategory?.roleCategoryId ?? null,
							)
						}
					/>
				) : null}
				{settings.visibleCategories.map((roleCategory) => (
					<RoleDropZone
						key={roleCategory.roleCategoryId}
						name={roleCategory.name}
						roles={
							settings.rolesByCategory.get(roleCategory.roleCategoryId) ?? []
						}
						categoryKey={String(roleCategory.roleCategoryId)}
						dragOverCategory={settings.dragOverCategory}
						disabled={settings.moveRoleMutation.isPending}
						deleteAction={
							<IconButton
								type="button"
								aria-label={`${roleCategory.name} 역할 분류 삭제`}
								onClick={() => settings.setPendingDelete(roleCategory)}
							>
								<DeleteIcon />
							</IconButton>
						}
						onRoleClick={settings.setSelectedRole}
						onDragStart={settings.setDraggedRoleId}
						onDragOverCategory={settings.setDragOverCategory}
						onDrop={(event) =>
							settings.handleDrop(event, roleCategory.roleCategoryId)
						}
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
							disabled={settings.createCategoryMutation.isPending}
							onClick={() => settings.setCreatingCategory(true)}
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
				open={settings.creatingCategory}
				pending={settings.createCategoryMutation.isPending}
				onOpenChange={settings.setCreatingCategory}
				onSubmit={(name) => settings.createCategoryMutation.mutate(name)}
			/>
			<RoleSettingsDialog
				role={settings.selectedRole}
				categories={settings.roleCategories.map((category) => ({
					id: category.roleCategoryId,
					name: category.isVerification
						? "juicer 이용에 필요한 역할"
						: category.name,
				}))}
				pending={settings.roleSettingsMutation.isPending}
				onOpenChange={(open) => !open && settings.setSelectedRole(null)}
				onSubmit={(value) => {
					if (settings.selectedRole) {
						settings.roleSettingsMutation.mutate({
							role: settings.selectedRole,
							...value,
						});
					}
				}}
			/>
			<DeleteRoleCategoryDialog
				roleCategory={settings.pendingDelete}
				pending={settings.deleteCategoryMutation.isPending}
				onOpenChange={(open) => !open && settings.setPendingDelete(null)}
				onConfirm={() => {
					if (settings.pendingDelete) {
						settings.deleteCategoryMutation.mutate({
							serverId,
							roleCategoryId: settings.pendingDelete.roleCategoryId,
						});
					}
				}}
			/>
		</>
	);
}

export default RoleSettingsSection;
