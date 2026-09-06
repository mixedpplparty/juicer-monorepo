import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
	type CategoryNameFormInput,
	type CategoryNameFormOutput,
	categoryNameFormSchema,
} from "@/shared/forms/category-name-schema";
export interface RoleCategoryDialogProps {
	open: boolean;
	pending?: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (body: CategoryNameFormOutput) => void;
}

function useRoleCategoryDialogModel({
	open,
	pending = false,
	onOpenChange,
	onSubmit,
}: RoleCategoryDialogProps) {
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
export type RoleCategoryDialogViewModel = ReturnType<
	typeof useRoleCategoryDialogModel
>;
export function RoleCategoryDialogPresenter({
	children,
	...props
}: RoleCategoryDialogProps & {
	children: (model: RoleCategoryDialogViewModel) => ReactNode;
}) {
	const model = useRoleCategoryDialogModel(props);
	return children(model);
}
