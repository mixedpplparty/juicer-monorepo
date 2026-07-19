import { Button } from "@mixedpplparty/juicer-m3/button";
import { Checkbox } from "@mixedpplparty/juicer-m3/checkbox";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { topicAssociationDialogStyles } from "./topic-association-dialog.styles";

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

export function TopicAssociationDialog({
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

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Popup scrollable>
				<Dialog.Title>{title}</Dialog.Title>
				<Dialog.Content css={topicAssociationDialogStyles.content}>
					{options.length > 0 ? (
						<List
							container="transparent"
							aria-label={title}
							css={topicAssociationDialogStyles.list}
						>
							{options.map((option) => (
								<ListItem
									key={option.id}
									css={topicAssociationDialogStyles.item}
									aria-disabled={disabled || undefined}
									headline={option.headline}
									supportingText={option.supportingText}
									onClick={
										disabled
											? undefined
											: () => toggle(option.id, !draftIds.has(option.id))
									}
									leading={
										<Checkbox
											checked={draftIds.has(option.id)}
											disabled={disabled}
											aria-label={`${option.label} 선택`}
											onClick={(event) => event.stopPropagation()}
											onCheckedChange={(checked) => toggle(option.id, checked)}
										/>
									}
								/>
							))}
						</List>
					) : (
						<Text
							as="p"
							typeRole="body"
							size="medium"
							css={topicAssociationDialogStyles.empty}
						>
							선택할 항목이 없습니다.
						</Text>
					)}
				</Dialog.Content>
				<Dialog.Actions>
					<Button
						type="button"
						variant="text"
						disabled={disabled}
						onClick={() => onOpenChange(false)}
					>
						취소
					</Button>
					<Button
						type="button"
						disabled={disabled}
						onClick={() => {
							onConfirm([...draftIds]);
							onOpenChange(false);
						}}
					>
						확인
					</Button>
				</Dialog.Actions>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default TopicAssociationDialog;
