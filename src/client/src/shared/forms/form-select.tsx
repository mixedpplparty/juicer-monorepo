import { Select, type SelectRootProps } from "@mixedpplparty/juicer-m3/select";
import type { ReactNode } from "react";
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
> = Omit<
	SelectRootProps<FieldPathValue<TFieldValues, TName>>,
	"defaultValue" | "name" | "onValueChange" | "value"
> & {
	control: UseControllerProps<TFieldValues, TName>["control"];
	errorText?: ReactNode;
	name: TName;
	rules?: Omit<
		RegisterOptions<TFieldValues, TName>,
		"disabled" | "setValueAs" | "valueAsDate" | "valueAsNumber"
	>;
};

export function FormSelect<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
>({
	children,
	control,
	disabled,
	errorText,
	fieldProps,
	name,
	onOpenChange,
	rules,
	...props
}: FormSelectProps<TFieldValues, TName>) {
	const { field, fieldState } = useController({
		control,
		disabled,
		name,
		rules,
	});

	return (
		<Select.Root
			{...props}
			disabled={field.disabled}
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
