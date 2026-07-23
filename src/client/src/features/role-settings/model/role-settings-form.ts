import type { RoleSettingsRole } from "juicer-shared";
import {
	type RoleSettingsFormInput,
	unassignedRoleCategoryValue,
} from "@/shared/forms/form-schemas";

export function getRoleSettingsDefaultValues(
	role: RoleSettingsRole,
): RoleSettingsFormInput {
	return {
		roleCategoryId:
			role.categoryId === null
				? unassignedRoleCategoryValue
				: String(role.categoryId),
		selfAssignable: role.selfAssignable,
		description: role.description ?? "",
	};
}
