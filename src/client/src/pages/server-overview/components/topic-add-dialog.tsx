import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerData } from "juicer-shared";
import { useForm } from "react-hook-form";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import { FormInput } from "@/shared/forms/form-input";
import {
	noTopicCategoryValue,
	type TopicCreateFormInput,
	type TopicCreateFormOutput,
	topicCreateFormSchema,
} from "@/shared/forms/form-schemas";
import { FormSelect } from "@/shared/forms/form-select";
import { createTopic } from "../api/mutations";
import { topicAddDialogStyles } from "./topic-add-dialog.styles";

const defaultValues: TopicCreateFormInput = {
	name: "",
	description: "",
	categoryId: null,
};

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
	const form = useForm<TopicCreateFormInput, unknown, TopicCreateFormOutput>({
		defaultValues,
		mode: "onChange",
		resolver: zodResolver(topicCreateFormSchema),
	});
	const { isDirty, isValid } = form.formState;
	const categories = [
		{ label: "선택 안 함", value: noTopicCategoryValue },
		...(serverData.serverDataDb?.categories?.map((category) => ({
			label: category.name,
			value: String(category.categoryId),
		})) ?? []),
	];

	useUnsavedChangesWarning(open && isDirty);

	const mutation = useMutation({
		mutationFn: createTopic,
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: topicQueryKeys.lists.byServer(serverId),
				type: "active",
			});
			form.reset(defaultValues);
			onOpenChange(false);
		},
	});

	const resetForm = () => {
		form.reset(defaultValues);
		mutation.reset();
	};

	const requestClose = () => {
		if (mutation.isPending) {
			return;
		}

		if (
			isDirty &&
			!window.confirm("저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?")
		) {
			return;
		}

		resetForm();
		onOpenChange(false);
	};

	const submit = form.handleSubmit((body) => {
		if (mutation.isPending) {
			return;
		}

		mutation.mutate({
			serverId,
			body,
		});
	});

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			onOpenChange(true);
		} else {
			requestClose();
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Popup>
				<Dialog.Title>주제 추가</Dialog.Title>
				<form css={topicAddDialogStyles.form} onSubmit={submit}>
					<Dialog.Content css={topicAddDialogStyles.fields}>
						<FormInput
							control={form.control}
							name="name"
							label="이름"
							required
							disabled={mutation.isPending}
						/>
						<FormInput
							control={form.control}
							name="description"
							label="설명 (선택)"
							disabled={mutation.isPending}
						/>

						<div css={topicAddDialogStyles.categoryField}>
							<FormSelect
								control={form.control}
								name="categoryId"
								items={categories}
								disabled={mutation.isPending}
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
							</FormSelect>
						</div>

						{mutation.error && (
							<Text
								as="p"
								typeRole="body"
								size="medium"
								role="alert"
								css={topicAddDialogStyles.error}
							>
								{mutation.error.message}
							</Text>
						)}
					</Dialog.Content>

					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={mutation.isPending}
							onClick={requestClose}
						>
							취소
						</Button>
						<Button type="submit" disabled={mutation.isPending || !isValid}>
							{mutation.isPending ? "추가하는 중..." : "추가하기"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default TopicAddDialog;
