import type { RoleSettingsRole } from "juicer-shared";
import { type DragEvent, useState } from "react";

interface UseRoleDragAndDropOptions {
	roles: RoleSettingsRole[];
	disabled: boolean;
	onMoveRole: (roleId: string, roleCategoryId: number | null) => void;
}

export function useRoleDragAndDrop({
	roles,
	disabled,
	onMoveRole,
}: UseRoleDragAndDropOptions) {
	const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
	const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

	const resetDragState = () => {
		setDraggedRoleId(null);
		setDragOverCategory(null);
	};

	const handleDrop = (
		event: DragEvent<HTMLElement>,
		roleCategoryId: number | null,
	) => {
		event.preventDefault();
		const roleId = draggedRoleId ?? event.dataTransfer.getData("text/plain");
		const role = roles.find((candidate) => candidate.id === roleId);
		resetDragState();

		if (!role?.editable || role.categoryId === roleCategoryId || disabled) {
			return;
		}
		onMoveRole(roleId, roleCategoryId);
	};

	return {
		dragOverCategory,
		handleDragStart: setDraggedRoleId,
		handleDragOverCategory: setDragOverCategory,
		handleDragEnd: resetDragState,
		handleDrop,
	};
}
