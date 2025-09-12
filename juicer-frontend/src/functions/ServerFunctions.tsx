import type {
	Game,
	Role,
	ServerData,
	ServerDataDiscordRole,
} from "../types/types";

export const _findRoleById = (
	_serverData: ServerData,
	roleId: string,
): ServerDataDiscordRole | undefined => {
	return _serverData.server_data_discord.roles?.find(
		(r: ServerDataDiscordRole) => r.id === roleId,
	);
};
export const _iHaveAllRolesInTheGame = (
	_serverData: ServerData,
	game: Game,
): boolean => {
	if (!game.roles_to_add || game.roles_to_add.length === 0) return false;
	return (
		game.roles_to_add?.every(
			(role: Role) => _findRoleById(_serverData, role.id)?.me_in_role,
		) || false
	);
};

// filter out @everyone role
export const filterOutEveryoneRole = (
	_serverData: ServerData,
	roles: Role[],
): Role[] => {
	return (
		roles.filter(
			(role: Role) => _findRoleById(_serverData, role.id)?.name !== "@everyone",
		) || []
	);
};

export const _findGameById = (
	_serverData: ServerData,
	gameId: string,
): Game | undefined => {
	return _serverData.server_data_db.games?.find(
		(g: Game) => g.id === parseInt(gameId),
	);
};
