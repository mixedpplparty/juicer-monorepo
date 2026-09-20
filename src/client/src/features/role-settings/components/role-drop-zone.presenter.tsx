import type { RoleSettingsRole } from "juicer-shared";
import type { DragEvent, ReactNode } from "react";
export interface RoleDropZoneProps {
	name: string;
	roles: RoleSettingsRole[];
	categoryKey: string;
	dragOverCategory: string | null;
	disabled: boolean;
	deleteAction?: ReactNode;
	onRoleClick: (role: RoleSettingsRole) => void;
	onDragStart: (roleId: string) => void;
	onDragOverCategory: (categoryKey: string | null) => void;
	onDragEnd: () => void;
	onDrop: (event: DragEvent<HTMLElement>) => void;
}

function useRoleDropZoneModel({
	name,
	roles,
	categoryKey,
	dragOverCategory,
	disabled,
	deleteAction,
	onRoleClick,
	onDragStart,
	onDragOverCategory,
	onDragEnd,
	onDrop,
}: RoleDropZoneProps) {
	const headingId = `role-category-${categoryKey}`;
	const isDragOver = dragOverCategory === categoryKey;
	const roleItems = roles.map((role) => ({
		role,
		disabled: disabled || !role.editable,
	}));
	function enterCategory() {
		if (!disabled) onDragOverCategory(categoryKey);
	}
	function dragOver(event: DragEvent<HTMLElement>) {
		if (!disabled) event.preventDefault();
	}
	function leaveCategory(event: DragEvent<HTMLElement>) {
		if (!event.currentTarget.contains(event.relatedTarget as Node))
			onDragOverCategory(null);
	}
	function startRoleDrag(
		event: DragEvent<HTMLElement>,
		role: RoleSettingsRole,
	) {
		if (disabled || !role.editable) {
			event.preventDefault();
			return;
		}
		event.dataTransfer.setData("text/plain", role.id);
		event.dataTransfer.effectAllowed = "move";
		onDragStart(role.id);
	}
	return {
		name,
		roles,
		deleteAction,
		onRoleClick,
		onDragEnd,
		onDrop,
		headingId,
		isDragOver,
		roleItems,
		enterCategory,
		dragOver,
		leaveCategory,
		startRoleDrag,
	};
}
export type RoleDropZoneViewModel = ReturnType<typeof useRoleDropZoneModel>;
export function RoleDropZonePresenter({
	children,
	...props
}: RoleDropZoneProps & {
	children: (model: RoleDropZoneViewModel) => ReactNode;
}) {
	const model = useRoleDropZoneModel(props);
	return children(model);
}
