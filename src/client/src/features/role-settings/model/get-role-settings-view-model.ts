import type { RoleSettingsView } from "juicer-shared";
import { groupRolesByCategory } from "./group-roles-by-category";

export function getRoleSettingsViewModel(settings: RoleSettingsView) {
	return {
		rolesByCategory: groupRolesByCategory(settings.roles),
		verificationCategory: settings.categories.find(
			(category) => category.kind === "verification",
		),
		visibleCategories: settings.categories.filter(
			(category) => category.kind !== "verification",
		),
		categoryOptions: settings.categories.map((category) => ({
			id: category.id,
			name:
				category.kind === "verification"
					? "juicer 이용에 필요한 역할"
					: category.name,
		})),
	};
}
