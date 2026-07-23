import { useSuspenseQuery } from "@tanstack/react-query";
import { roleSettingsQueryOptions } from "../api/queries";
import { groupRolesByCategory } from "../model/group-roles-by-category";
import { useRoleDragAndDrop } from "../model/use-role-drag-and-drop";
import { useRoleSettingsMutations } from "../model/use-role-settings-mutations";
import RoleSettingsView from "./role-settings-view";

interface RoleSettingsSectionProps {
	serverId: string;
}

export function RoleSettingsSection({ serverId }: RoleSettingsSectionProps) {
	const { data: roleSettings } = useSuspenseQuery(
		roleSettingsQueryOptions(serverId),
	);
	const mutations = useRoleSettingsMutations(serverId);
	const dragAndDrop = useRoleDragAndDrop({
		roles: roleSettings.roles,
		disabled: mutations.isMovingRole,
		onMoveRole: mutations.moveRole,
	});
	const rolesByCategory = groupRolesByCategory(roleSettings.roles);

	return (
		<RoleSettingsView
			roleSettings={roleSettings}
			rolesByCategory={rolesByCategory}
			dragOverCategory={dragAndDrop.dragOverCategory}
			isCreatingCategory={mutations.isCreatingCategory}
			isMovingRole={mutations.isMovingRole}
			isSavingRoleSettings={mutations.isSavingRoleSettings}
			isDeletingCategory={mutations.isDeletingCategory}
			onCreateCategory={mutations.createCategory}
			onSaveRoleSettings={mutations.saveRoleSettings}
			onDeleteCategory={mutations.deleteCategory}
			onDragStart={dragAndDrop.handleDragStart}
			onDragOverCategory={dragAndDrop.handleDragOverCategory}
			onDragEnd={dragAndDrop.handleDragEnd}
			onDrop={dragAndDrop.handleDrop}
		/>
	);
}

export default RoleSettingsSection;
