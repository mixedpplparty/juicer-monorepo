import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import type {
	NameRequiredRequestBody,
	RoleSettingsCategory,
	RoleSettingsView as RoleSettingsData,
	RoleSettingsRole,
} from "juicer-shared";
import { type DragEvent, useState } from "react";
import type { RoleSettingsFormOutput } from "@/shared/forms/form-schemas";
import DeleteRoleCategoryDialog from "./delete-role-category-dialog";
import RoleCategoryDialog from "./role-category-dialog";
import RoleDropZone from "./role-drop-zone";
import RoleSettingsDialog from "./role-settings-dialog";
import { roleSettingsSectionStyles } from "./role-settings-section.styles";

interface RoleSettingsViewProps {
	roleSettings: RoleSettingsData;
	rolesByCategory: Map<number | null, RoleSettingsRole[]>;
	dragOverCategory: string | null;
	isCreatingCategory: boolean;
	isMovingRole: boolean;
	isSavingRoleSettings: boolean;
	isDeletingCategory: boolean;
	onCreateCategory: (body: NameRequiredRequestBody) => Promise<boolean>;
	onSaveRoleSettings: (
		roleId: string,
		value: RoleSettingsFormOutput,
	) => Promise<boolean>;
	onDeleteCategory: (roleCategoryId: number) => Promise<boolean>;
	onDragStart: (roleId: string) => void;
	onDragOverCategory: (categoryKey: string | null) => void;
	onDragEnd: () => void;
	onDrop: (
		event: DragEvent<HTMLElement>,
		roleCategoryId: number | null,
	) => void;
}

export function RoleSettingsView({
	roleSettings,
	rolesByCategory,
	dragOverCategory,
	isCreatingCategory,
	isMovingRole,
	isSavingRoleSettings,
	isDeletingCategory,
	onCreateCategory,
	onSaveRoleSettings,
	onDeleteCategory,
	onDragStart,
	onDragOverCategory,
	onDragEnd,
	onDrop,
}: RoleSettingsViewProps) {
	const [creatingCategory, setCreatingCategory] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleSettingsRole | null>(
		null,
	);
	const [pendingDelete, setPendingDelete] =
		useState<RoleSettingsCategory | null>(null);
	const verificationCategory = roleSettings.categories.find(
		(category) => category.kind === "verification",
	);
	const visibleCategories = roleSettings.categories.filter(
		(category) => category.kind !== "verification",
	);

	const createCategory = (body: NameRequiredRequestBody) => {
		void onCreateCategory(body).then((succeeded) => {
			if (succeeded) {
				setCreatingCategory(false);
			}
		});
	};
	const saveRoleSettings = (
		role: RoleSettingsRole,
		value: RoleSettingsFormOutput,
	) => {
		void onSaveRoleSettings(role.id, value).then((succeeded) => {
			if (succeeded) {
				setSelectedRole(null);
			}
		});
	};
	const deleteCategory = (roleCategory: RoleSettingsCategory) => {
		void onDeleteCategory(roleCategory.id).then((succeeded) => {
			if (succeeded) {
				setPendingDelete(null);
			}
		});
	};

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
					categories={roleSettings.categories.map((category) => ({
						id: category.id,
						name:
							category.kind === "verification"
								? "juicer 이용에 필요한 역할"
								: category.name,
					}))}
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

export default RoleSettingsView;
