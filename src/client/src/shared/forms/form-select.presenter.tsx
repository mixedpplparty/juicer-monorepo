import type { SelectRootProps } from "@mixedpplparty/juicer-m3/select";
import type { ReactNode } from "react";
import type { UseControllerReturn } from "react-hook-form";
import {
	type FieldPath,
	type FieldPathValue,
	type FieldValues,
	type RegisterOptions,
	type UseControllerProps,
	useController,
} from "react-hook-form";
export type FormSelectProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	SelectRootProps<FieldPathValue<TFieldValues, TName>>,
	"defaultValue" | "name" | "onValueChange" | "value"
> & {
	control: UseControllerProps<
		TFieldValues,
		TName,
		TTransformedValues
	>["control"];
	errorText?: ReactNode;
	name: TName;
	rules?: Omit<
		RegisterOptions<TFieldValues, TName>,
		"disabled" | "setValueAs" | "valueAsDate" | "valueAsNumber"
	>;
};
export type FormSelectViewModel<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	FormSelectProps<TFieldValues, TName, TTransformedValues>,
	"control" | "name" | "rules"
> &
	Pick<UseControllerReturn<TFieldValues, TName>, "field" | "fieldState">;

export function FormSelectPresenter<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	renderModel,
	children,
	control,
	disabled,
	errorText,
	fieldProps,
	name,
	onOpenChange,
	rules,
	...props
}: FormSelectProps<TFieldValues, TName, TTransformedValues> & {
	renderModel: (
		model: FormSelectViewModel<TFieldValues, TName, TTransformedValues>,
	) => ReactNode;
}) {
	const { field, fieldState } = useController({
		control,
		name,
		rules,
	});
	// Pending UI controls must stay registered so submission retains their values.
	return renderModel({
		disabled,
		children,
		errorText,
		fieldProps,
		onOpenChange,
		...props,
		field,
		fieldState,
	});
}
