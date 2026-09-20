import type { SwitchProps } from "@mixedpplparty/juicer-m3/switch";
import type { ReactNode } from "react";
import type { UseControllerReturn } from "react-hook-form";
import {
	type FieldPathByValue,
	type FieldValues,
	type RegisterOptions,
	type UseControllerProps,
	useController,
} from "react-hook-form";
export type FormSwitchProps<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	SwitchProps,
	"checked" | "defaultChecked" | "name" | "onCheckedChange"
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
export type FormSwitchViewModel<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
	TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
	FormSwitchProps<TFieldValues, TName, TTransformedValues>,
	"control" | "name" | "rules"
> &
	Pick<UseControllerReturn<TFieldValues, TName>, "field">;

export function FormSwitchPresenter<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	renderModel,
	control,
	disabled,
	name,
	onBlur,
	rules,
	...props
}: FormSwitchProps<TFieldValues, TName, TTransformedValues> & {
	renderModel: (
		model: FormSwitchViewModel<TFieldValues, TName, TTransformedValues>,
	) => ReactNode;
}) {
	const { field } = useController({ control, name, rules });
	// Pending UI controls must stay registered so submission retains their values.
	return renderModel({ disabled, onBlur, ...props, field });
}
