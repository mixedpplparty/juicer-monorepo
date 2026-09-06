import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
	type CategoryNameFormInput,
	type CategoryNameFormOutput,
	categoryNameFormSchema,
} from "@/shared/forms/category-name-schema";
export interface TopicCategoryDialogProps {
	open: boolean;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (body: CategoryNameFormOutput) => void;
}

function useTopicCategoryDialogModel({
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
	return {
		open,
		pending,
		onOpenChange,
		control,
		isValid,
		submit,
	};
}
export type TopicCategoryDialogViewModel = ReturnType<
	typeof useTopicCategoryDialogModel
>;
export function TopicCategoryDialogPresenter({
	children,
	...props
}: TopicCategoryDialogProps & {
	children: (model: TopicCategoryDialogViewModel) => ReactNode;
}) {
	const model = useTopicCategoryDialogModel(props);
	return children(model);
}
