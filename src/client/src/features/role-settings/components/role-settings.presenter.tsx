import type {
	NameRequiredRequestBody,
	RoleSettingsCategory,
	RoleSettingsView as RoleSettingsData,
	RoleSettingsRole,
} from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
import type { RoleSettingsFormOutput } from "@/features/role-settings/model/role-settings-schema";
import type { Refetch } from "@/shared/api/refetch";
import { getRoleSettingsViewModel } from "../model/get-role-settings-view-model";
import { useRoleDragAndDrop } from "../model/use-role-drag-and-drop";
import { useRoleSettingsActions } from "../model/use-role-settings-actions";
export interface RoleSettingsProps {
	serverId: string;
	roleSettings: RoleSettingsData;
	refetchRoles: Refetch;
}

function useRoleSettingsModel({
	serverId,
	roleSettings,
	refetchRoles,
}: RoleSettingsProps) {
	const {
		createCategory: onCreateCategory,
		saveRoleSettings: onSaveRoleSettings,
		deleteCategory: onDeleteCategory,
		moveRole,
		isCreatingCategory,
		isMovingRole,
		isSavingRoleSettings,
		isDeletingCategory,
	} = useRoleSettingsActions(serverId, refetchRoles);
	const {
		dragOverCategory,
		handleDragStart: onDragStart,
		handleDragOverCategory: onDragOverCategory,
		handleDragEnd: onDragEnd,
		handleDrop: onDrop,
	} = useRoleDragAndDrop({
		roles: roleSettings.roles,
		disabled: isMovingRole,
		onMoveRole: moveRole,
	});
	const {
		rolesByCategory,
		verificationCategory,
		visibleCategories,
		categoryOptions,
	} = getRoleSettingsViewModel(roleSettings);
	const [creatingCategory, setCreatingCategory] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleSettingsRole | null>(
		null,
	);
	const [pendingDelete, setPendingDelete] =
		useState<RoleSettingsCategory | null>(null);
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
	return {
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
	};
}
export type RoleSettingsViewModel = ReturnType<typeof useRoleSettingsModel>;
export function RoleSettingsPresenter({
	children,
	...props
}: RoleSettingsProps & {
	children: (model: RoleSettingsViewModel) => ReactNode;
}) {
	const model = useRoleSettingsModel(props);
	return children(model);
}
