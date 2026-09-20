import { Switch } from "@mixedpplparty/juicer-m3/switch";
import type { FieldPathByValue, FieldValues } from "react-hook-form";
import type { FormSwitchViewModel } from "./form-switch.presenter";
export function FormSwitchView<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	disabled,
	onBlur,
	field,
	...props
}: FormSwitchViewModel<TFieldValues, TName, TTransformedValues>) {
	return (
		<Switch
			{...props}
			disabled={disabled}
			inputRef={field.ref}
			name={field.name}
			checked={Boolean(field.value)}
			onCheckedChange={field.onChange}
			onBlur={(event) => {
				field.onBlur();
				onBlur?.(event);
			}}
		/>
	);
}
