// Example of importing and using shared types
import type { Game, Role, ServerData } from "@juicer/shared";

// You can now use the shared types throughout your frontend
export const exampleFunction = (serverData: ServerData): Game[] => {
	return serverData.games || [];
};

export const getRolesByCategory = (
	roles: Role[],
	categoryId: number,
): Role[] => {
	return roles.filter((role) => role.role_category_id === categoryId);
};
