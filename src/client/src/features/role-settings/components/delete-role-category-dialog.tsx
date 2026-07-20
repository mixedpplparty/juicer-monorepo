import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import type { RoleCategory } from "juicer-shared";
import { deleteRoleCategoryDialogStyles } from "./delete-role-category-dialog.styles";

interface DeleteRoleCategoryDialogProps {
	roleCategory: RoleCategory | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteRoleCategoryDialog({
	roleCategory,
	pending,
	onOpenChange,
	onConfirm,
}: DeleteRoleCategoryDialogProps) {
	return (
		<Dialog.Root
			open={roleCategory !== null}
			onOpenChange={(open) => !pending && onOpenChange(open)}
		>
			<Dialog.Popup>
				<Dialog.Title>역할 분류를 삭제할까요?</Dialog.Title>
				<Dialog.Description>
					‘{roleCategory?.name}’ 분류가 삭제되고, 이 분류의 역할은 미분류 상태로
					돌아갑니다.
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
						css={deleteRoleCategoryDialogStyles.deleteButton}
						onClick={onConfirm}
					>
						{pending ? "삭제 중…" : "삭제"}
					</Button>
				</Dialog.Actions>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default DeleteRoleCategoryDialog;
