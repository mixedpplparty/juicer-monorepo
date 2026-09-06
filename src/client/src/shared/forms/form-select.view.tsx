import { Select } from "@mixedpplparty/juicer-m3/select";
import type { FieldPath, FieldValues } from "react-hook-form";
import type { FormSelectViewModel } from "./form-select.presenter";
export function FormSelectView<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues extends FieldValues = TFieldValues,
>({
	disabled,
	children,
	errorText,
	fieldProps,
	onOpenChange,
	field,
	fieldState,
	...props
}: FormSelectViewModel<TFieldValues, TName, TTransformedValues>) {
	return (
		<Select.Root
			{...props}
			disabled={disabled}
			inputRef={field.ref}
			name={field.name}
			value={field.value}
			onValueChange={field.onChange}
			onOpenChange={(open, eventDetails) => {
				if (!open) {
					field.onBlur();
				}
				onOpenChange?.(open, eventDetails);
			}}
			fieldProps={{
				...fieldProps,
				invalid: fieldState.invalid || fieldProps?.invalid,
			}}
		>
			{children}
			{fieldState.invalid || errorText ? (
				<Select.Error>{fieldState.error?.message ?? errorText}</Select.Error>
			) : null}
		</Select.Root>
	);
}
