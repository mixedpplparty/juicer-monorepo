import { Button, IconButton } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import type { TopicDeleteDialogViewModel } from "./topic-delete-dialog.presenter";
import { topicDeleteDialogStyles } from "./topic-delete-dialog.styles";
export function TopicDeleteDialogView({
	topicName,
	open,
	setOpen,
	removeTopicPending,
	removeTopic,
}: TopicDeleteDialogViewModel) {
	return (
		<>
			<IconButton
				type="button"
				aria-label="주제 삭제"
				disabled={removeTopicPending}
				css={topicDeleteDialogStyles.trigger}
				onClick={() => setOpen(true)}
			>
				<DeleteIcon />
			</IconButton>

			<Dialog.Root
				open={open}
				onOpenChange={(nextOpen) => !removeTopicPending && setOpen(nextOpen)}
			>
				<Dialog.Popup>
					<Dialog.Title>주제를 삭제할까요?</Dialog.Title>
					<Dialog.Description>
						‘{topicName}’ 주제와 연결된 역할 및 채널 정보가 삭제됩니다. 이
						작업은 되돌릴 수 없습니다.
					</Dialog.Description>
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={removeTopicPending}
							onClick={() => setOpen(false)}
						>
							취소
						</Button>
						<Button
							type="button"
							disabled={removeTopicPending}
							css={topicDeleteDialogStyles.confirmButton}
							onClick={() => void removeTopic()}
						>
							{removeTopicPending ? "삭제 중…" : "삭제"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
