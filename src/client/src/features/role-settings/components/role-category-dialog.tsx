import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { useForm } from "react-hook-form";
import { FormInput } from "@/shared/forms/form-input";
import { roleCategoryDialogStyles } from "./role-category-dialog.styles";

interface RoleCategoryFormValues {
	name: string;
}

export interface RoleCategoryDialogProps {
	open: boolean;
	pending?: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (name: string) => void;
}

export function RoleCategoryDialog({
	open,
	pending = false,
	onOpenChange,
	onSubmit,
}: RoleCategoryDialogProps) {
	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm<RoleCategoryFormValues>({
		defaultValues: { name: "" },
		mode: "onChange",
	});

	const submit = handleSubmit(({ name }) => {
		if (!pending) {
			onSubmit(name.trim());
		}
	});

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
							rules={{
								validate: (value) =>
									value.trim().length > 0 || "이름을 입력해주세요.",
							}}
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

export default RoleCategoryDialog;
