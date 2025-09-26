import * as z from "zod";
export const CreateGameRequestBody = z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
});
export const UpdateGameRequestBody = z.object({
    gameId: z.number(),
    serverId: z.string(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    thumbnail: z.instanceof(Buffer).nullable().optional(),
    channels: z.array(z.string()).nullable().optional(),
    tagIds: z.array(z.number()).nullable().optional(),
    roleIds: z.array(z.string()).nullable().optional(),
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
    file: z.instanceof(Buffer),
});
export const NameRequiredRequestBody = z.object({
    name: z.string(),
});
export const AssignRoleCategoryToRoleRequestBody = z.object({
    roleId: z.string(),
});
