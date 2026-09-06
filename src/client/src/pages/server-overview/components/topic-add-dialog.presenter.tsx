import { zodResolver } from "@hookform/resolvers/zod";
import type { ServerData } from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createTopic } from "@/features/server/api/mutations";
import {
	noTopicCategoryValue,
	type TopicCreateFormInput,
	type TopicCreateFormOutput,
	topicCreateFormSchema,
} from "@/features/topics/model/topic-form-schema";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";

const defaultValues: TopicCreateFormInput = {
	name: "",
	description: "",
	categoryId: null,
};
export interface TopicAddDialogProps {
	open: boolean;
	serverId: string;
	refetchTopics: Refetch;
	serverData: ServerData;
	onOpenChange: (open: boolean) => void;
}

function useTopicAddDialogModel({
	open,
	serverId,
	refetchTopics,
	serverData,
	onOpenChange,
}: TopicAddDialogProps) {
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
	const [addTopicPending, withAddTopic] = useLoading();
	const [addTopicError, setAddTopicError] = useState<Error | null>(null);

	async function addTopic(body: TopicCreateFormOutput) {
		if (addTopicPending) return;
		setAddTopicError(null);
		await withAddTopic(async () => {
			try {
				await createTopic({ serverId, body });

				await refetchTopics();
				form.reset(defaultValues);
				onOpenChange(false);
			} catch (error) {
				setAddTopicError(
					error instanceof Error
						? error
						: new Error("요청을 처리하지 못했습니다."),
				);
			}
		});
	}
	const resetForm = () => {
		form.reset(defaultValues);
		setAddTopicError(null);
	};
	const requestClose = () => {
		if (addTopicPending) {
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
		if (addTopicPending) {
			return;
		}

		return addTopic(body);
	});
	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			onOpenChange(true);
		} else {
			requestClose();
		}
	};
	return {
		open,
		form,
		isValid,
		categories,
		addTopicPending,
		addTopicError,
		requestClose,
		submit,
		handleOpenChange,
	};
}
export type TopicAddDialogViewModel = ReturnType<typeof useTopicAddDialogModel>;
export function TopicAddDialogPresenter({
	children,
	...props
}: TopicAddDialogProps & {
	children: (model: TopicAddDialogViewModel) => ReactNode;
}) {
	const model = useTopicAddDialogModel(props);
	return children(model);
}
