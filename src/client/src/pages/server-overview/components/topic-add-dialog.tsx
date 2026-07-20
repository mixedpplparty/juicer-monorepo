import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerData } from "juicer-shared";
import { type FormEvent, useRef, useState } from "react";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import { createTopic } from "../api/mutations";
import { topicAddDialogStyles } from "./topic-add-dialog.styles";

export interface TopicAddDialogProps {
	open: boolean;
	serverId: string;
	serverData: ServerData;
	onOpenChange: (open: boolean) => void;
}

export function TopicAddDialog({
	open,
	serverId,
	serverData,
	onOpenChange,
}: TopicAddDialogProps) {
	const queryClient = useQueryClient();
	const formRef = useRef<HTMLFormElement>(null);
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const categories = [
		{ label: "선택 안 함", value: "none" },
		...(serverData.serverDataDb?.categories?.map((category) => ({
			label: category.name,
			value: String(category.categoryId),
		})) ?? []),
	];

	useUnsavedChangesWarning(open && hasUnsavedChanges);

	const resetForm = () => {
		formRef.current?.reset();
		setCategoryId(null);
		setHasUnsavedChanges(false);
		createTopicMutation.reset();
	};

	const createTopicMutation = useMutation({
		mutationFn: createTopic,
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: topicQueryKeys.lists.byServer(serverId),
				type: "active",
			});
			resetForm();
			onOpenChange(false);
		},
	});

	const requestClose = () => {
		if (createTopicMutation.isPending) {
			return;
		}

		if (
			hasUnsavedChanges &&
			!window.confirm("저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?")
		) {
			return;
		}

		resetForm();
		onOpenChange(false);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			onOpenChange(true);
		} else {
			requestClose();
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const description = String(formData.get("description") ?? "");

		createTopicMutation.mutate({
			serverId,
			name: String(formData.get("name") ?? ""),
			description: description || null,
			categoryId:
				categoryId && categoryId !== "none" ? Number(categoryId) : null,
		});
	};

	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Popup>
				<Dialog.Title>주제 추가</Dialog.Title>
				<form
					ref={formRef}
					css={topicAddDialogStyles.form}
					onChange={() => setHasUnsavedChanges(true)}
					onSubmit={handleSubmit}
				>
					<Dialog.Content css={topicAddDialogStyles.fields}>
						<TextField label="이름" name="name" required />
						<TextField label="설명 (선택)" name="description" />

						<div css={topicAddDialogStyles.categoryField}>
							<Select.Root
								items={categories}
								value={categoryId}
								onValueChange={(value) => {
									setCategoryId(value);
									setHasUnsavedChanges(true);
								}}
							>
								<Select.Label>카테고리 (선택)</Select.Label>
								<Select.Trigger>
									<Select.Value placeholder="카테고리 선택" />
									<Select.Icon />
								</Select.Trigger>
								<Select.Popup>
									<Select.List>
										{categories.map((category) => (
											<Select.Item key={category.value} value={category.value}>
												<Select.ItemIndicator />
												<Select.ItemText>{category.label}</Select.ItemText>
											</Select.Item>
										))}
									</Select.List>
								</Select.Popup>
							</Select.Root>
						</div>

						{createTopicMutation.error && (
							<Text
								as="p"
								typeRole="body"
								size="medium"
								role="alert"
								css={topicAddDialogStyles.error}
							>
								{createTopicMutation.error.message}
							</Text>
						)}
					</Dialog.Content>

					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={createTopicMutation.isPending}
							onClick={requestClose}
						>
							취소
						</Button>
						<Button type="submit" disabled={createTopicMutation.isPending}>
							{createTopicMutation.isPending ? "추가하는 중..." : "추가하기"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default TopicAddDialog;
