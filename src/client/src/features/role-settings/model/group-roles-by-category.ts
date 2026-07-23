import type { RoleSettingsRole } from "juicer-shared";

export function groupRolesByCategory(roles: RoleSettingsRole[]) {
	const rolesByCategory = new Map<number | null, RoleSettingsRole[]>();

	for (const role of roles) {
		const groupedRoles = rolesByCategory.get(role.categoryId) ?? [];
		groupedRoles.push(role);
		rolesByCategory.set(role.categoryId, groupedRoles);
	}

	return rolesByCategory;
}
