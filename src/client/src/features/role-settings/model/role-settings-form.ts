export const unassignedRoleCategoryValue = "unassigned";

export interface RoleSettingsValue {
	id: string;
	name: string;
	color: string;
	roleCategoryId: number | null;
	selfAssignable: boolean;
	description: string | null;
}

export interface RoleSettingsFormValues {
	roleCategoryId: string;
	selfAssignable: boolean;
	description: string;
}

export function getRoleSettingsDefaultValues(
	role: RoleSettingsValue,
): RoleSettingsFormValues {
	return {
		roleCategoryId:
			role.roleCategoryId === null
				? unassignedRoleCategoryValue
				: String(role.roleCategoryId),
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
