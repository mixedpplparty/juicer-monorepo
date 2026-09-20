import type { FieldPathByValue, FieldValues } from "react-hook-form";
import {
	FormInputPresenter,
	type FormInputProps,
} from "./form-input.presenter";
import { FormInputView } from "./form-input.view";

export type { FormInputProps } from "./form-input.presenter";
export function FormInput<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues extends FieldValues = TFieldValues,
>(props: FormInputProps<TFieldValues, TName, TTransformedValues>) {
	return (
		<FormInputPresenter
			{...props}
			renderModel={(model) => <FormInputView {...model} />}
		/>
	);
}
