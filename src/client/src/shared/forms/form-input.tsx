import {
	TextField,
	type TextFieldProps,
} from "@mixedpplparty/juicer-m3/text-field";
import {
	type FieldPathByValue,
	type FieldPathValue,
	type FieldValues,
	type RegisterOptions,
	type UseControllerProps,
	useController,
} from "react-hook-form";

export type FormInputProps<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
	TextFieldProps,
	"defaultValue" | "name" | "onBlur" | "onChange" | "value"
> & {
	control: UseControllerProps<TFieldValues, TName>["control"];
	name: TName;
	rules?: Omit<
		RegisterOptions<TFieldValues, TName>,
		"disabled" | "setValueAs" | "valueAsDate" | "valueAsNumber"
	>;
};

export function FormInput<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
>({
	control,
	disabled,
	name,
	rules,
	errorText,
	rootProps,
	...props
}: FormInputProps<TFieldValues, TName>) {
	const { field, fieldState } = useController({
		control,
		disabled,
		name,
		rules,
	});

	return (
		<TextField
			{...props}
			ref={field.ref}
			disabled={field.disabled}
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
