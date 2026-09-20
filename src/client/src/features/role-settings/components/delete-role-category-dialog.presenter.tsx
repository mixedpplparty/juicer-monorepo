import type { RoleSettingsCategory } from "juicer-shared";
import type { ReactNode } from "react";
export interface DeleteRoleCategoryDialogProps {
	roleCategory: RoleSettingsCategory | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

function useDeleteRoleCategoryDialogModel({
	roleCategory,
	pending,
	onOpenChange,
	onConfirm,
}: DeleteRoleCategoryDialogProps) {
	const open = roleCategory !== null;
	function changeOpen(nextOpen: boolean) {
		if (!pending) onOpenChange(nextOpen);
	}
	function confirm() {
		if (!pending) onConfirm();
	}
	return {
		roleCategory,
		pending,
		open,
		changeOpen,
		confirm,
	};
}
export type DeleteRoleCategoryDialogViewModel = ReturnType<
	typeof useDeleteRoleCategoryDialogModel
>;
export function DeleteRoleCategoryDialogPresenter({
	children,
	...props
}: DeleteRoleCategoryDialogProps & {
	children: (model: DeleteRoleCategoryDialogViewModel) => ReactNode;
}) {
	const model = useDeleteRoleCategoryDialogModel(props);
	return children(model);
}
