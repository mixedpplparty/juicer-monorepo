import type { NameRequiredRequestBody } from "juicer-shared";
import { z } from "zod";
import {
	apiSchema,
	formValidationLimits,
	requiredTrimmedName,
} from "./validation";
export const categoryNameFormSchema = apiSchema<NameRequiredRequestBody>()(
	z.object({
		name: requiredTrimmedName(
			formValidationLimits.categoryName,
			"이름을 입력해주세요.",
			"이름",
		),
	}),
);

export type CategoryNameFormInput = z.input<typeof categoryNameFormSchema>;
export type CategoryNameFormOutput = z.output<typeof categoryNameFormSchema>;
