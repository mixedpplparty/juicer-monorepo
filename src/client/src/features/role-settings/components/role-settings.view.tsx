import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import DeleteRoleCategoryDialog from "./delete-role-category-dialog";
import RoleCategoryDialog from "./role-category-dialog";
import RoleDropZone from "./role-drop-zone";
import type { RoleSettingsViewModel } from "./role-settings.presenter";
import RoleSettingsDialog from "./role-settings-dialog";
import { roleSettingsSectionStyles } from "./role-settings-section.styles";
export function RoleSettingsView({
	isCreatingCategory,
	isMovingRole,
	isSavingRoleSettings,
	isDeletingCategory,
	dragOverCategory,
	onDragStart,
	onDragOverCategory,
	onDragEnd,
	onDrop,
	rolesByCategory,
	verificationCategory,
	visibleCategories,
	categoryOptions,
	creatingCategory,
	setCreatingCategory,
	selectedRole,
	setSelectedRole,
	pendingDelete,
	setPendingDelete,
	createCategory,
	saveRoleSettings,
	deleteCategory,
}: RoleSettingsViewModel) {
	return (
		<>
			<div css={roleSettingsSectionStyles.groups}>
				<RoleDropZone
					name="분류 없는 역할"
					roles={rolesByCategory.get(null) ?? []}
					categoryKey="unassigned"
					dragOverCategory={dragOverCategory}
					disabled={isMovingRole}
					onRoleClick={setSelectedRole}
					onDragStart={onDragStart}
					onDragOverCategory={onDragOverCategory}
					onDragEnd={onDragEnd}
					onDrop={(event) => onDrop(event, null)}
				/>
				{verificationCategory ? (
					<RoleDropZone
						name="juicer 이용에 필요한 역할"
						roles={rolesByCategory.get(verificationCategory.id) ?? []}
						categoryKey={String(verificationCategory.id)}
						dragOverCategory={dragOverCategory}
						disabled={isMovingRole}
						onRoleClick={setSelectedRole}
						onDragStart={onDragStart}
						onDragOverCategory={onDragOverCategory}
						onDragEnd={onDragEnd}
						onDrop={(event) => onDrop(event, verificationCategory.id)}
					/>
				) : null}
				{visibleCategories.map((roleCategory) => (
					<RoleDropZone
						key={roleCategory.id}
						name={roleCategory.name}
						roles={rolesByCategory.get(roleCategory.id) ?? []}
						categoryKey={String(roleCategory.id)}
						dragOverCategory={dragOverCategory}
						disabled={isMovingRole}
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
						onDragStart={onDragStart}
						onDragOverCategory={onDragOverCategory}
						onDragEnd={onDragEnd}
						onDrop={(event) => onDrop(event, roleCategory.id)}
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
							disabled={isCreatingCategory}
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
				pending={isCreatingCategory}
				onOpenChange={setCreatingCategory}
				onSubmit={createCategory}
			/>
			{selectedRole ? (
				<RoleSettingsDialog
					role={selectedRole}
					categories={categoryOptions}
					pending={isSavingRoleSettings}
					onOpenChange={(open) => !open && setSelectedRole(null)}
					onSubmit={(value) => saveRoleSettings(selectedRole, value)}
				/>
			) : null}
			<DeleteRoleCategoryDialog
				roleCategory={pendingDelete}
				pending={isDeletingCategory}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				onConfirm={() => pendingDelete && deleteCategory(pendingDelete)}
			/>
		</>
	);
}
