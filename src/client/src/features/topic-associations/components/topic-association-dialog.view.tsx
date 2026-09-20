import { Button } from "@mixedpplparty/juicer-m3/button";
import { Checkbox } from "@mixedpplparty/juicer-m3/checkbox";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { TopicAssociationDialogViewModel } from "./topic-association-dialog.presenter";
import { topicAssociationDialogStyles } from "./topic-association-dialog.styles";
export function TopicAssociationDialogView({
	open,
	title,
	options,
	disabled,
	changeOpen,
	confirmSelection,
	draftIds,
	toggle,
}: TopicAssociationDialogViewModel) {
	return (
		<Dialog.Root open={open} onOpenChange={changeOpen}>
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
						onClick={() => changeOpen(false)}
					>
						취소
					</Button>
					<Button type="button" disabled={disabled} onClick={confirmSelection}>
						확인
					</Button>
				</Dialog.Actions>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
