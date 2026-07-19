import type { Role as DiscordRole } from "discord.js";
import type {
	CategorizedRoleGroup,
	Role as DatabaseRole,
	RoleCategory,
	ServerMemberRole,
} from "juicer-shared/dist/types/index.js";

export interface CategorizeMemberRolesOptions {
	serverId: string;
	memberRoles: Iterable<DiscordRole>;
	databaseRoles: DatabaseRole[];
	roleCategories: RoleCategory[];
}

export function categorizeMemberRoles({
	serverId,
	memberRoles,
	databaseRoles,
	roleCategories,
}: CategorizeMemberRolesOptions): CategorizedRoleGroup[] {
	const databaseRoleById = new Map(
		databaseRoles.map((role) => [role.roleId, role]),
	);
	const categoryById = new Map(
		roleCategories.map((category) => [category.roleCategoryId, category]),
	);
	const rolesByCategoryId = new Map<number, ServerMemberRole[]>();
	const uncategorizedRoles: ServerMemberRole[] = [];

	for (const role of memberRoles) {
		if (role.id === serverId) {
			continue;
		}

		const databaseRole = databaseRoleById.get(role.id);
		if (!databaseRole) {
			continue;
		}

		const memberRole = {
			roleId: role.id,
			name: role.name,
			color: role.hexColor,
		} satisfies ServerMemberRole;
		const roleCategoryId = databaseRole.roleCategoryId;

		if (roleCategoryId === null) {
			uncategorizedRoles.push(memberRole);
			continue;
		}

		if (!categoryById.has(roleCategoryId)) {
			uncategorizedRoles.push(memberRole);
			continue;
		}

		const categorizedRoles = rolesByCategoryId.get(roleCategoryId);
		if (categorizedRoles) {
			categorizedRoles.push(memberRole);
		} else {
			rolesByCategoryId.set(roleCategoryId, [memberRole]);
		}
	}

	const result: CategorizedRoleGroup[] = roleCategories.flatMap(
		(roleCategory) => {
			const roles = rolesByCategoryId.get(roleCategory.roleCategoryId);
			return roles?.length
				? [
						{
							roleCategoryId: roleCategory.roleCategoryId,
							roleCategoryName: roleCategory.name,
							roles,
						},
					]
				: [];
		},
	);

	if (uncategorizedRoles.length) {
		result.push({
			roleCategoryId: null,
			roleCategoryName: null,
			roles: uncategorizedRoles,
		});
	}

	return result;
}
