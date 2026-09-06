import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { FormInput } from "@/shared/forms/form-input";
import type { RoleCategoryDialogViewModel } from "./role-category-dialog.presenter";
import { roleCategoryDialogStyles } from "./role-category-dialog.styles";
export function RoleCategoryDialogView({
	open,
	pending,
	onOpenChange,
	control,
	isValid,
	submit,
}: RoleCategoryDialogViewModel) {
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}
		>
			<Dialog.Popup>
				<form css={roleCategoryDialogStyles.form} onSubmit={submit}>
					<Dialog.Title>역할 분류 추가</Dialog.Title>
					<Dialog.Content>
						<FormInput
							control={control}
							name="name"
							label="이름"
							variant="filled"
							required
							disabled={pending}
							css={roleCategoryDialogStyles.field}
						/>
					</Dialog.Content>
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={pending}
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={pending || !isValid}>
							{pending ? "추가 중…" : "추가"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
