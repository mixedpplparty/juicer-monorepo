import type { UpdateRoleSettingsRequest } from "juicer-shared/dist/types/index.js";

export interface RoleSettingsUpdate {
	roleCategoryId?: number | null;
	selfAssignable?: boolean;
	description?: string | null;
}

export function buildRoleSettingsUpdate(
	input: UpdateRoleSettingsRequest,
): RoleSettingsUpdate {
	const update: RoleSettingsUpdate = {};

	if (input.roleCategoryId !== undefined) {
		update.roleCategoryId = input.roleCategoryId;
	}
	if (input.selfAssignable !== undefined) {
		update.selfAssignable = input.selfAssignable;
	}
	if (input.description !== undefined) {
		update.description = input.description;
	}

	return update;
}
