import { Switch, type SwitchProps } from "@mixedpplparty/juicer-m3/switch";
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
> = Omit<
	SwitchProps,
	"checked" | "defaultChecked" | "name" | "onCheckedChange"
> & {
	control: UseControllerProps<TFieldValues, TName>["control"];
	name: TName;
	rules?: Omit<
		RegisterOptions<TFieldValues, TName>,
		"disabled" | "setValueAs" | "valueAsDate" | "valueAsNumber"
	>;
};

export function FormSwitch<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
>({
	control,
	disabled,
	name,
	onBlur,
	rules,
	...props
}: FormSwitchProps<TFieldValues, TName>) {
	const { field } = useController({ control, disabled, name, rules });

	return (
		<Switch
			{...props}
			disabled={field.disabled}
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
