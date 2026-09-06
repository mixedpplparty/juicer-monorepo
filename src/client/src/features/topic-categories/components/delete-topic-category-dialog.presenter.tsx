import type { Category } from "juicer-shared";
import type { ReactNode } from "react";
export interface DeleteTopicCategoryDialogProps {
	category: Category | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

function useDeleteTopicCategoryDialogModel({
	category,
	pending,
	onOpenChange,
	onConfirm,
}: DeleteTopicCategoryDialogProps) {
	const open = category !== null;
	function changeOpen(nextOpen: boolean) {
		if (!pending) onOpenChange(nextOpen);
	}
	function confirm() {
		if (!pending) onConfirm();
	}
	return {
		category,
		pending,
		open,
		changeOpen,
		confirm,
	};
}
export type DeleteTopicCategoryDialogViewModel = ReturnType<
	typeof useDeleteTopicCategoryDialogModel
>;
export function DeleteTopicCategoryDialogPresenter({
	children,
	...props
}: DeleteTopicCategoryDialogProps & {
	children: (model: DeleteTopicCategoryDialogViewModel) => ReactNode;
}) {
	const model = useDeleteTopicCategoryDialogModel(props);
	return children(model);
}
