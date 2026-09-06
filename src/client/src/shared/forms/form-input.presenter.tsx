import type { TextFieldProps } from "@mixedpplparty/juicer-m3/text-field";
import type { ReactNode } from "react";
import type { UseControllerReturn } from "react-hook-form";
import {
	type FieldPathByValue,
	type FieldValues,
	type RegisterOptions,
	type UseControllerProps,
	useController,
} from "react-hook-form";
export type FormInputProps<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	TextFieldProps,
	"defaultValue" | "name" | "onBlur" | "onChange" | "value"
> & {
	control: UseControllerProps<
		TFieldValues,
		TName,
		TTransformedValues
	>["control"];
	name: TName;
	rules?: Omit<
		RegisterOptions<TFieldValues, TName>,
		"disabled" | "setValueAs" | "valueAsDate" | "valueAsNumber"
	>;
};
export type FormInputViewModel<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	FormInputProps<TFieldValues, TName, TTransformedValues>,
	"control" | "name" | "rules"
> &
	Pick<UseControllerReturn<TFieldValues, TName>, "field" | "fieldState">;

export function FormInputPresenter<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	renderModel,
	control,
	disabled,
	name,
	rules,
	errorText,
	rootProps,
	...props
}: FormInputProps<TFieldValues, TName, TTransformedValues> & {
	renderModel: (
		model: FormInputViewModel<TFieldValues, TName, TTransformedValues>,
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
		errorText,
		rootProps,
		...props,
		field,
		fieldState,
	});
}
