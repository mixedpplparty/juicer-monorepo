import type {
	Game,
	Role,
	RoleRelationToGame,
	ServerData,
	ServerDataDiscordRole2,
} from "juicer-shared";

export const _findRoleById = (
	_serverData: ServerData,
	roleId: string,
): ServerDataDiscordRole2 | undefined => {
	return _serverData.server_data_discord.roles?.find(
		(r: ServerDataDiscordRole2) => r.id === roleId,
	);
};

export const _findGameById = (
	_serverData: ServerData,
	gameId: string,
): Game | undefined => {
	return _serverData.server_data_db.games?.find(
		(g: Game) => g.gameId === parseInt(gameId),
	);
};

export const _iHaveAllRolesInTheGame = (
	_serverData: ServerData,
	game: Game,
): boolean => {
	if (!game.gamesRoles || game.gamesRoles.length === 0) return false;
	// filter out @everyone role
	const filteredRoles = filterOutEveryoneRole(_serverData, game.gamesRoles);
	return (
		filteredRoles?.every(
			(role: Role | RoleRelationToGame) =>
				_findRoleById(_serverData, role.roleId)?.meInRole,
		) || false
	);
};

// filter out @everyone role
export const filterOutEveryoneRole = (
	_serverData: ServerData,
	roles: Role[] | RoleRelationToGame[],
): (Role | RoleRelationToGame)[] => {
	return (
		roles.filter(
			(role: Role | RoleRelationToGame) =>
				_findRoleById(_serverData, role.roleId)?.name !== "@everyone",
		) || []
	);
};

export const _iHaveRole = (
	_serverData: ServerData,
	roleId: string,
): boolean => {
	return _findRoleById(_serverData, roleId)?.meInRole || false;
};
