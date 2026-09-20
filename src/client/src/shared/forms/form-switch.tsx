import type { FieldPathByValue, FieldValues } from "react-hook-form";
import {
	FormSwitchPresenter,
	type FormSwitchProps,
} from "./form-switch.presenter";
import { FormSwitchView } from "./form-switch.view";

export type { FormSwitchProps } from "./form-switch.presenter";
export function FormSwitch<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, boolean>,
	TTransformedValues extends FieldValues = TFieldValues,
>(props: FormSwitchProps<TFieldValues, TName, TTransformedValues>) {
	return (
		<FormSwitchPresenter
			{...props}
			renderModel={(model) => <FormSwitchView {...model} />}
		/>
	);
}
