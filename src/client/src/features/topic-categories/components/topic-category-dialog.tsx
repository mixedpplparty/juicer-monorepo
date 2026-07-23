import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { useForm } from "react-hook-form";
import { FormInput } from "@/shared/forms/form-input";
import {
	type CategoryNameFormInput,
	type CategoryNameFormOutput,
	categoryNameFormSchema,
} from "@/shared/forms/form-schemas";
import { topicCategoryDialogStyles } from "./topic-category-dialog.styles";

interface TopicCategoryDialogProps {
	open: boolean;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (body: CategoryNameFormOutput) => void;
}

export function TopicCategoryDialog({
	open,
	pending,
	onOpenChange,
	onSubmit,
}: TopicCategoryDialogProps) {
	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm<CategoryNameFormInput, unknown, CategoryNameFormOutput>({
		defaultValues: { name: "" },
		mode: "onChange",
		resolver: zodResolver(categoryNameFormSchema),
	});

	const submit = handleSubmit((body) => {
		if (!pending) {
			onSubmit(body);
		}
	});

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}
		>
			<Dialog.Popup>
				<form css={topicCategoryDialogStyles.form} onSubmit={submit}>
					<Dialog.Title>주제 카테고리 추가</Dialog.Title>
					<Dialog.Content>
						<FormInput
							control={control}
							name="name"
							label="이름"
							variant="filled"
							required
							disabled={pending}
							css={topicCategoryDialogStyles.field}
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

export default TopicCategoryDialog;
