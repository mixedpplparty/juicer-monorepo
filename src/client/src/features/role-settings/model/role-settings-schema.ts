import type { UpdateRoleSettingsRequest } from "juicer-shared";
import { z } from "zod";
import {
	apiSchema,
	formValidationLimits,
	nullableDescription,
	nullablePositiveId,
} from "@/shared/forms/validation";
export const unassignedRoleCategoryValue = "unassigned";
type RoleSettingsSubmission = Required<
	Pick<
		UpdateRoleSettingsRequest,
		"roleCategoryId" | "selfAssignable" | "description"
	>
>;

export const roleSettingsFormSchema = apiSchema<RoleSettingsSubmission>()(
	z.object({
		roleCategoryId: nullablePositiveId(unassignedRoleCategoryValue),
		selfAssignable: z.boolean(),
		description: nullableDescription(formValidationLimits.roleDescription),
	}),
);

export type RoleSettingsFormInput = z.input<typeof roleSettingsFormSchema>;
export type RoleSettingsFormOutput = z.output<typeof roleSettingsFormSchema>;
