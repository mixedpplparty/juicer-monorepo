import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import type {
	FieldPathByValue,
	FieldPathValue,
	FieldValues,
} from "react-hook-form";
import type { FormInputViewModel } from "./form-input.presenter";
export function FormInputView<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	disabled,
	errorText,
	rootProps,
	field,
	fieldState,
	...props
}: FormInputViewModel<TFieldValues, TName, TTransformedValues>) {
	return (
		<TextField
			{...props}
			ref={field.ref}
			disabled={disabled}
			name={field.name}
			value={field.value as FieldPathValue<TFieldValues, TName>}
			onBlur={field.onBlur}
			onChange={field.onChange}
			aria-invalid={fieldState.invalid || undefined}
			errorText={fieldState.error?.message ?? errorText}
			rootProps={{
				...rootProps,
				invalid: fieldState.invalid || rootProps?.invalid,
			}}
		/>
	);
}
