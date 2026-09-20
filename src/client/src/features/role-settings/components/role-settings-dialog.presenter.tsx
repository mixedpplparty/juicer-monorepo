import { zodResolver } from "@hookform/resolvers/zod";
import type { RoleSettingsRole } from "juicer-shared";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
	type RoleSettingsFormInput,
	type RoleSettingsFormOutput,
	roleSettingsFormSchema,
	unassignedRoleCategoryValue,
} from "@/features/role-settings/model/role-settings-schema";
import { getRoleSettingsDefaultValues } from "../model/role-settings-form";
export interface RoleSettingsCategory {
	id: number;
	name: string;
}
export interface RoleSettingsDialogProps {
	role: RoleSettingsRole;
	categories: RoleSettingsCategory[];
	pending?: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: RoleSettingsFormOutput) => void;
}

function useRoleSettingsDialogModel({
	role,
	categories,
	pending = false,
	onOpenChange,
	onSubmit,
}: RoleSettingsDialogProps) {
	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm<RoleSettingsFormInput, unknown, RoleSettingsFormOutput>({
		defaultValues: getRoleSettingsDefaultValues(role),
		mode: "onChange",
		resolver: zodResolver(roleSettingsFormSchema),
	});
	const categoryItems = useMemo(
		() => [
			{ value: unassignedRoleCategoryValue, label: "분류 없음" },
			...categories.map((category) => ({
				value: String(category.id),
				label: category.name,
			})),
		],
		[categories],
	);
	const submit = handleSubmit((values) => {
		if (!pending) {
			onSubmit(values);
		}
	});
	return {
		role,
		pending,
		onOpenChange,
		control,
		isValid,
		categoryItems,
		submit,
	};
}
export type RoleSettingsDialogViewModel = ReturnType<
	typeof useRoleSettingsDialogModel
>;
export function RoleSettingsDialogPresenter({
	children,
	...props
}: RoleSettingsDialogProps & {
	children: (model: RoleSettingsDialogViewModel) => ReactNode;
}) {
	const model = useRoleSettingsDialogModel(props);
	return children(model);
}
