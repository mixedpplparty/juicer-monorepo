import type { FieldPath, FieldValues } from "react-hook-form";
import {
	FormSelectPresenter,
	type FormSelectProps,
} from "./form-select.presenter";
import { FormSelectView } from "./form-select.view";

export type { FormSelectProps } from "./form-select.presenter";
export function FormSelect<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues extends FieldValues = TFieldValues,
>(props: FormSelectProps<TFieldValues, TName, TTransformedValues>) {
	return (
		<FormSelectPresenter
			{...props}
			renderModel={(model) => <FormSelectView {...model} />}
		/>
	);
}
