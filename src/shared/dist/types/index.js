import * as z from "zod";
export const ThumbnailImage = z
    .file()
    .mime([
    "image/png",
    "image/jpeg",
    "image/apng",
    "image/avif",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    "image/tiff",
])
    .min(100)
    .max(1_048_576)
    .optional()
    .nullable();
const FilteredGuild = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
    ownerId: z.string(),
    ownerName: z.string(),
    ownerNick: z.string().optional(),
    memberCount: z.number(),
});
const Category = z.object({
    categoryId: z.number(),
    serverId: z.string(),
    name: z.string(),
});
const RoleCategory = z.object({
    roleCategoryId: z.number(),
    serverId: z.string(),
    name: z.string(),
});
const Tag = z.object({
    tagId: z.number(),
    name: z.string(),
    serverId: z.string().nullable(),
});
const TagRelationToGame = z.object({
    gameId: z.number(),
    tagId: z.number(),
});
const Role = z.object({
    serverId: z.string(),
    roleId: z.string(),
    roleCategoryId: z.number().nullable(),
    selfAssignable: z.boolean(),
    description: z.string().nullable(),
});
const RoleRelationToGame = z.object({
    gameId: z.number(),
    roleId: z.string(),
});
const Channel = z.object({
    id: z.string(),
});
const GameWithoutRelations = z.object({
    gameId: z.number(),
    serverId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    // Optional: list/serverData endpoints omit the heavy bytea blob; the client
    // fetches thumbnails lazily via the dedicated /games/:id/thumbnail endpoint.
    thumbnail: z.instanceof(Buffer).nullable().optional(),
    channels: z.array(z.string()).nullable(),
});
const Game = z.intersection(GameWithoutRelations, z.object({
    gamesTags: z.array(TagRelationToGame).nullable(),
    gamesRoles: z.array(RoleRelationToGame).nullable(),
}));
const ServerDataDiscordRole2 = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(), // hex color in #ABCDEF
    icon: z.string().nullable(),
    managed: z.boolean(),
    meInRole: z.boolean(),
});
const ServerDataDiscordChannel = z.object({
    id: z.string(),
    name: z.string(),
});
const FilteredServerDataDiscord = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
    ownerId: z.string(),
    ownerName: z.string(),
    ownerNick: z.string().nullable(),
    memberCount: z.number(),
    roles: z.array(ServerDataDiscordRole2).nullable(),
    channels: z.array(ServerDataDiscordChannel).nullable(),
});
const ServerDataDb = z.object({
    serverId: z.string(),
    createdAt: z.date(),
    verificationRequired: z.boolean(),
    games: z.array(Game).nullable(),
    roles: z.array(Role).nullable(),
    categories: z.array(Category).nullable(),
    roleCategories: z.array(RoleCategory).nullable(),
    tags: z.array(Tag).nullable(),
    birthdayChannelId: z.string().nullable(),
    birthdayTimezone: z.string().nullable(),
    birthdayMessageTemplate: z.string().nullable(),
    birthdayEventNameTemplate: z.string().nullable(),
    birthdayEventDescriptionTemplate: z.string().nullable(),
});
const ServerData = z.object({
    admin: z.boolean(),
    serverDataDb: ServerDataDb.nullable(),
    serverDataDiscord: FilteredServerDataDiscord,
});
const MyDataInServer = z.object({
    id: z.string(),
    name: z.string(),
    nick: z.string().nullable(),
    avatar: z.string().nullable(),
    roles: z.array(Role).nullable(),
    joined_at: z.string(),
});
const AuthData = z.object({
    discord_access_token: z.string(),
    discord_refresh_token: z.string(),
});
const ToastProps = z.object({
    type: z.enum(["error", "success", "info"]).nullable(),
});
const ToastObject = z.object({
    idx: z.number(),
    message: z.string(),
    type: ToastProps.type,
});
const MessageOnSuccess = z.object({
    detail: z.string(),
});
const SyncRolesResponse = z.object({
    roles_created: z.array(z.string()),
    roles_deleted: z.array(z.string()),
});
const CreateServerResponse = z.object({
    serverId: z.string(),
    createdAt: z.date(),
    verificationRequired: z.boolean(),
});
const CreateGameDBParams = z.object({
    serverId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
});
export const CreateGameRequestBody = z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
});
const CreateGameResponse = z.object({
    gameId: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    categoryId: z.number().nullable(),
    serverId: z.string(),
    thumbnail: z.instanceof(Buffer).nullable(),
    channels: z.array(z.string()).nullable(),
});
export const UpdateGameRequestBody = z.object({
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    thumbnail: ThumbnailImage,
    channels: z.array(z.string()).nullable().optional(),
    tagIds: z.array(z.number()).nullable().optional(),
    roleIds: z.array(z.string()).nullable().optional(),
});
export const UpdateGameRequestBodyWithImageAsBuffer = z.object({
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    thumbnail: z.instanceof(Buffer).nullable().optional(),
    channels: z.array(z.string()).nullable().optional(),
    tagIds: z.array(z.number()).nullable().optional(),
    roleIds: z.array(z.string()).nullable().optional(),
});
export const UpdateGameResponse = z.object({
    updatedGame: GameWithoutRelations.nullable(),
    tags: z.object({
        added: z.array(TagRelationToGame).nullable(),
        removed: z.array(TagRelationToGame).nullable(),
    }),
    roles: z.object({
        added: z.array(RoleRelationToGame).nullable(),
        removed: z.array(RoleRelationToGame).nullable(),
    }),
});
export const DeleteGameRequestBody = z.object({
    gameId: z.number(),
    serverId: z.string(),
});
export const CreateTagRequestBody = z.object({
    serverId: z.string(),
    name: z.string(),
});
export const GetAllTagsInServerRequestBody = z.object({
    serverId: z.string(),
});
export const DeleteTagRequestBody = z.object({
    tagId: z.number(),
    serverId: z.string(),
});
export const CreateRoleInDbRequestBody = z.object({
    serverId: z.string(),
    roleId: z.string(),
});
export const CreateCategoryRequestBody = z.object({
    serverId: z.string(),
    name: z.string(),
});
export const CreateRoleCategoryRequestBody = z.object({
    serverId: z.string(),
    name: z.string(),
});
export const AddCategoryToGameRequestBody = z.object({
    categoryId: z.number(),
});
export const ModifyTagsOfGameRequestBody = z.object({
    tagIds: z.array(z.number()),
});
export const UpdateGameThumbnailRequestBody = z.object({
    file: ThumbnailImage,
});
export const NameRequiredRequestBody = z.object({
    name: z.string(),
});
export const AssignRoleCategoryToRoleRequestBody = z.object({
    roleCategoryId: z.number().nullable(),
    roleId: z.string(),
});
export const SetRoleSelfAssignableRequestBody = z.object({
    selfAssignable: z.boolean().optional().nullable(),
    description: z.string().nullable().optional(),
});
export const GuildMember = z.object({
    avatarURL: z.string().nullable(),
    bannerURL: z.string().nullable(),
    displayAvatarURL: z.string().nullable(),
    displayBannerURL: z.string().nullable(),
    avatarDecorationURL: z.string().nullable(),
    roles: z.array(z.string()),
});
export const UpdateServerVerificationRequiredRequestBody = z.object({
    verificationRequired: z.boolean(),
});
// ── Birthday announcements ──────────────────────────────────────────────
// Max day per month with Feb 29 allowed (leap-agnostic). Rejects Feb 30/31,
// Apr/Jun/Sep/Nov 31, etc. Year is intentionally not stored.
const _MAX_DAY_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function isValidMonthDay(month, day) {
    if (!Number.isInteger(month) || !Number.isInteger(day))
        return false;
    if (month < 1 || month > 12)
        return false;
    if (day < 1)
        return false;
    return day <= _MAX_DAY_PER_MONTH[month - 1];
}
export const UpdateBirthdayRequestBody = z
    .object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
})
    .refine((b) => isValidMonthDay(b.month, b.day), {
    message: "Invalid month/day combination.",
});
const GetBirthdayResponse = z
    .object({
    month: z.number(),
    day: z.number(),
    editable: z.boolean(),
    editableUntil: z.string(),
})
    .nullable();
export const UpdateServerBirthdayConfigRequestBody = z.object({
    channelId: z.string().nullable(),
    timezone: z.string().nullable(),
    messageTemplate: z.string().nullable().optional(),
    eventNameTemplate: z.string().nullable().optional(),
    eventDescriptionTemplate: z.string().nullable().optional(),
});
