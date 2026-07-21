import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import { type FormEvent, useEffect, useState } from "react";
import { topicCategoryDialogStyles } from "./topic-category-dialog.styles";

interface TopicCategoryDialogProps {
	open: boolean;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (name: string) => void;
}

export function TopicCategoryDialog({
	open,
	pending,
	onOpenChange,
	onSubmit,
}: TopicCategoryDialogProps) {
	const [name, setName] = useState("");

	useEffect(() => {
		if (open) {
			setName("");
		}
	}, [open]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedName = name.trim();
		if (trimmedName && !pending) {
			onSubmit(trimmedName);
		}
	};

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}
		>
			<Dialog.Popup>
				<form css={topicCategoryDialogStyles.form} onSubmit={handleSubmit}>
					<Dialog.Title>주제 카테고리 추가</Dialog.Title>
					<Dialog.Content>
						<TextField
							label="이름"
							variant="filled"
							required
							disabled={pending}
							value={name}
							css={topicCategoryDialogStyles.field}
							onChange={(event) => setName(event.currentTarget.value)}
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
						<Button type="submit" disabled={pending || !name.trim()}>
							{pending ? "추가 중…" : "추가"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default TopicCategoryDialog;
