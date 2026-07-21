import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import type { Category } from "juicer-shared";
import { topicCategorySettingsStyles } from "./topic-category-settings.styles";

interface DeleteTopicCategoryDialogProps {
	category: Category | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteTopicCategoryDialog({
	category,
	pending,
	onOpenChange,
	onConfirm,
}: DeleteTopicCategoryDialogProps) {
	return (
		<Dialog.Root
			open={category !== null}
			onOpenChange={(open) => !pending && onOpenChange(open)}
		>
			<Dialog.Popup>
				<Dialog.Title>주제 카테고리를 삭제할까요?</Dialog.Title>
				<Dialog.Description>
					‘{category?.name}’ 카테고리가 삭제되고, 이 카테고리의 주제는 미분류
					상태로 돌아갑니다.
				</Dialog.Description>
				<Dialog.Actions>
					<Button
						type="button"
						variant="text"
						disabled={pending}
						onClick={() => onOpenChange(false)}
					>
						취소
					</Button>
					<Button
						type="button"
						disabled={pending}
						css={topicCategorySettingsStyles.deleteButton}
						onClick={onConfirm}
					>
						{pending ? "삭제 중…" : "삭제"}
					</Button>
				</Dialog.Actions>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default DeleteTopicCategoryDialog;
