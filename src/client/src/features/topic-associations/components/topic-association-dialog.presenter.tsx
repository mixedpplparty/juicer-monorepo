import type { ReactNode } from "react";
import { useEffect, useState } from "react";
export interface TopicAssociationOption {
	id: string;
	label: string;
	headline: ReactNode;
	supportingText?: ReactNode;
}
export interface TopicAssociationDialogProps {
	open: boolean;
	title: string;
	options: TopicAssociationOption[];
	selectedIds: string[];
	disabled?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (selectedIds: string[]) => void;
}

function useTopicAssociationDialogModel({
	open,
	title,
	options,
	selectedIds,
	disabled = false,
	onOpenChange,
	onConfirm,
}: TopicAssociationDialogProps) {
	const [draftIds, setDraftIds] = useState(() => new Set(selectedIds));
	useEffect(() => {
		if (open) {
			setDraftIds(new Set(selectedIds));
		}
	}, [open, selectedIds]);
	const toggle = (id: string, checked: boolean) => {
		if (disabled) return;
		setDraftIds((current) => {
			const next = new Set(current);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};
	function confirmSelection() {
		if (disabled) return;
		onConfirm([...draftIds]);
		onOpenChange(false);
	}
	function changeOpen(nextOpen: boolean) {
		if (!disabled) onOpenChange(nextOpen);
	}
	return {
		open,
		title,
		options,
		disabled,
		changeOpen,
		confirmSelection,
		draftIds,
		toggle,
	};
}
export type TopicAssociationDialogViewModel = ReturnType<
	typeof useTopicAssociationDialogModel
>;
export function TopicAssociationDialogPresenter({
	children,
	...props
}: TopicAssociationDialogProps & {
	children: (model: TopicAssociationDialogViewModel) => ReactNode;
}) {
	const model = useTopicAssociationDialogModel(props);
	return children(model);
}
