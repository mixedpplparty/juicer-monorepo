import * as z from "zod";
export const SyncRolesResponse = z.object({
    roles_created: z.array(z.string()),
    roles_deleted: z.array(z.string()),
});
export const CreateGameRequestBody = z.object({
    name: z.string(),
    description: z.string().nullable(),
    categoryId: z.number().nullable(),
});
export const UpdateGameRequestBody = z.object({
    gameId: z.number(),
    serverId: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    categoryId: z.number().nullable(),
    thumbnail: z.instanceof(Buffer).nullable(),
    channels: z.array(z.string()).nullable(),
    tagIds: z.array(z.number()).nullable(),
    roleIds: z.array(z.string()).nullable(),
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
export const AddTagsToGameRequestBody = z.object({
    tagIds: z.array(z.number()),
});
export const UpdateGameThumbnailRequestBody = z.object({
    file: z.instanceof(Buffer),
});
export const NameRequiredRequestBody = z.object({
    name: z.string(),
});
