import type { RoleSettingsRole } from "juicer-shared";
import { describe, expect, it } from "vitest";
import { groupRolesByCategory } from "./group-roles-by-category";

function createRole(id: string, categoryId: number | null): RoleSettingsRole {
	return {
		id,
		name: `role-${id}`,
		color: "#000000",
		categoryId,
		selfAssignable: false,
		description: null,
		editable: true,
	};
}

describe("groupRolesByCategory", () => {
	it("groups categorized and uncategorized roles", () => {
		const unassignedRole = createRole("1", null);
		const firstCategorizedRole = createRole("2", 10);
		const secondCategorizedRole = createRole("3", 10);

		const groups = groupRolesByCategory([
			unassignedRole,
			firstCategorizedRole,
			secondCategorizedRole,
		]);

		expect(groups.get(null)).toEqual([unassignedRole]);
		expect(groups.get(10)).toEqual([
			firstCategorizedRole,
			secondCategorizedRole,
		]);
	});

	it("returns an empty map when no roles exist", () => {
		expect(groupRolesByCategory([]).size).toBe(0);
	});
});
