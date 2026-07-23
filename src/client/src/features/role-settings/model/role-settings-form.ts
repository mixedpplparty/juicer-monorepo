import type { RoleSettingsRole } from "juicer-shared";

export const unassignedRoleCategoryValue = "unassigned";

export interface RoleSettingsFormValues {
	roleCategoryId: string;
	selfAssignable: boolean;
	description: string;
}

export function getRoleSettingsDefaultValues(
	role: RoleSettingsRole,
): RoleSettingsFormValues {
	return {
		roleCategoryId:
			role.categoryId === null
				? unassignedRoleCategoryValue
				: String(role.categoryId),
		selfAssignable: role.selfAssignable,
		description: role.description ?? "",
	};
}

export function toRoleSettingsSubmission(values: RoleSettingsFormValues) {
	return {
		roleCategoryId:
			values.roleCategoryId === unassignedRoleCategoryValue
				? null
				: Number(values.roleCategoryId),
		selfAssignable: values.selfAssignable,
		description: values.description.trim() || null,
	};
}
