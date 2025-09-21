// Shared types across frontend and backend
export interface User {
	id: string;
	username: string;
	email: string;
	avatar?: string;
	createdAt: Date;
}

export interface ServerData {
	server_id: string;
	name: string;
	icon?: string;
	owner_name: string;
	member_count: number;
	roles: Role[];
	role_categories: RoleCategory[];
	categories: Category[];
	tags: Tag[];
	games: Game[];
}

export interface Role {
	id: string;
	name: string;
	color: [number, number, number];
	role_category_id?: number | null;
}

export interface RoleCategory {
	id: number;
	name: string;
}

export interface Category {
	id: number;
	name: string;
}

export interface Tag {
	id: number;
	name: string;
}

export interface Game {
	id: number;
	name: string;
	description?: string;
	category?: Category;
	tags?: Tag[];
	roles_to_add?: Role[];
}

export interface AuthData {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface MyInfo {
	id: string;
	username: string;
	global_name?: string;
	avatar?: string;
}

export interface MyDataInServer {
	id: string;
	name: string;
	nick?: string;
	avatar?: string;
	roles?: Role[];
}

export interface MessageOnSuccess {
	message: string;
}

export interface SyncRolesResponse {
	message: string;
	roles_added: number;
	roles_updated: number;
}

// API Response types
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Common error types
export interface ApiError {
	detail: string;
	status: number;
}
