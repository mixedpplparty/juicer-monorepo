import type { GuildMember as DiscordJSGuildMember } from "discord.js";
import type { APIUser } from "discord-api-types/v10";
import * as z from "zod";
export declare const ThumbnailImage: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
declare const FilteredGuild: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    icon: z.ZodNullable<z.ZodString>;
    ownerId: z.ZodString;
    ownerName: z.ZodString;
    ownerNick: z.ZodOptional<z.ZodString>;
    memberCount: z.ZodNumber;
}, z.core.$strip>;
export type FilteredGuild = z.infer<typeof FilteredGuild>;
export type MyInfo = {
    userData: APIUser;
    guilds: FilteredGuild[];
};
declare const Category: z.ZodObject<{
    categoryId: z.ZodNumber;
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type Category = z.infer<typeof Category>;
declare const RoleCategory: z.ZodObject<{
    roleCategoryId: z.ZodNumber;
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type RoleCategory = z.infer<typeof RoleCategory>;
declare const Tag: z.ZodObject<{
    tagId: z.ZodNumber;
    name: z.ZodString;
    serverId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type Tag = z.infer<typeof Tag>;
declare const TagRelationToGame: z.ZodObject<{
    gameId: z.ZodNumber;
    tagId: z.ZodNumber;
}, z.core.$strip>;
export type TagRelationToGame = z.infer<typeof TagRelationToGame>;
declare const Role: z.ZodObject<{
    serverId: z.ZodString;
    roleId: z.ZodString;
    roleCategoryId: z.ZodNullable<z.ZodNumber>;
    selfAssignable: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type Role = z.infer<typeof Role>;
declare const RoleRelationToGame: z.ZodObject<{
    gameId: z.ZodNumber;
    roleId: z.ZodString;
}, z.core.$strip>;
export type RoleRelationToGame = z.infer<typeof RoleRelationToGame>;
declare const Channel: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type Channel = z.infer<typeof Channel>;
declare const GameWithoutRelations: z.ZodObject<{
    gameId: z.ZodNumber;
    serverId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
    channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type GameWithoutRelations = z.infer<typeof GameWithoutRelations>;
declare const Game: z.ZodIntersection<z.ZodObject<{
    gameId: z.ZodNumber;
    serverId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
    channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, z.ZodObject<{
    gamesTags: z.ZodNullable<z.ZodArray<z.ZodObject<{
        gameId: z.ZodNumber;
        tagId: z.ZodNumber;
    }, z.core.$strip>>>;
    gamesRoles: z.ZodNullable<z.ZodArray<z.ZodObject<{
        gameId: z.ZodNumber;
        roleId: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>>;
export type Game = z.infer<typeof Game>;
declare const ServerDataDiscordRole2: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    color: z.ZodString;
    icon: z.ZodNullable<z.ZodString>;
    managed: z.ZodBoolean;
    meInRole: z.ZodBoolean;
}, z.core.$strip>;
export type FilteredServerDataDiscord = z.infer<typeof FilteredServerDataDiscord>;
declare const ServerDataDiscordChannel: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type ServerDataDiscordChannel = z.infer<typeof ServerDataDiscordChannel>;
export type ServerDataDiscordRole2 = z.infer<typeof ServerDataDiscordRole2>;
declare const FilteredServerDataDiscord: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    icon: z.ZodNullable<z.ZodString>;
    ownerId: z.ZodString;
    ownerName: z.ZodString;
    ownerNick: z.ZodNullable<z.ZodString>;
    memberCount: z.ZodNumber;
    roles: z.ZodNullable<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        color: z.ZodString;
        icon: z.ZodNullable<z.ZodString>;
        managed: z.ZodBoolean;
        meInRole: z.ZodBoolean;
    }, z.core.$strip>>>;
    channels: z.ZodNullable<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
declare const ServerDataDb: z.ZodObject<{
    serverId: z.ZodString;
    createdAt: z.ZodDate;
    verificationRequired: z.ZodBoolean;
    games: z.ZodNullable<z.ZodArray<z.ZodIntersection<z.ZodObject<{
        gameId: z.ZodNumber;
        serverId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
        channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        gamesTags: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            tagId: z.ZodNumber;
        }, z.core.$strip>>>;
        gamesRoles: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            roleId: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>>;
    roles: z.ZodNullable<z.ZodArray<z.ZodObject<{
        serverId: z.ZodString;
        roleId: z.ZodString;
        roleCategoryId: z.ZodNullable<z.ZodNumber>;
        selfAssignable: z.ZodBoolean;
        description: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>;
    categories: z.ZodNullable<z.ZodArray<z.ZodObject<{
        categoryId: z.ZodNumber;
        serverId: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>>;
    roleCategories: z.ZodNullable<z.ZodArray<z.ZodObject<{
        roleCategoryId: z.ZodNumber;
        serverId: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>>;
    tags: z.ZodNullable<z.ZodArray<z.ZodObject<{
        tagId: z.ZodNumber;
        name: z.ZodString;
        serverId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>;
    birthdayChannelId: z.ZodNullable<z.ZodString>;
    birthdayTimezone: z.ZodNullable<z.ZodString>;
    birthdayMessageTemplate: z.ZodNullable<z.ZodString>;
    birthdayEventNameTemplate: z.ZodNullable<z.ZodString>;
    birthdayEventDescriptionTemplate: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type ServerDataDb = z.infer<typeof ServerDataDb>;
declare const ServerData: z.ZodObject<{
    admin: z.ZodBoolean;
    serverDataDb: z.ZodNullable<z.ZodObject<{
        serverId: z.ZodString;
        createdAt: z.ZodDate;
        verificationRequired: z.ZodBoolean;
        games: z.ZodNullable<z.ZodArray<z.ZodIntersection<z.ZodObject<{
            gameId: z.ZodNumber;
            serverId: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
            channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            gamesTags: z.ZodNullable<z.ZodArray<z.ZodObject<{
                gameId: z.ZodNumber;
                tagId: z.ZodNumber;
            }, z.core.$strip>>>;
            gamesRoles: z.ZodNullable<z.ZodArray<z.ZodObject<{
                gameId: z.ZodNumber;
                roleId: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>>;
        roles: z.ZodNullable<z.ZodArray<z.ZodObject<{
            serverId: z.ZodString;
            roleId: z.ZodString;
            roleCategoryId: z.ZodNullable<z.ZodNumber>;
            selfAssignable: z.ZodBoolean;
            description: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>>;
        categories: z.ZodNullable<z.ZodArray<z.ZodObject<{
            categoryId: z.ZodNumber;
            serverId: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>>>;
        roleCategories: z.ZodNullable<z.ZodArray<z.ZodObject<{
            roleCategoryId: z.ZodNumber;
            serverId: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>>>;
        tags: z.ZodNullable<z.ZodArray<z.ZodObject<{
            tagId: z.ZodNumber;
            name: z.ZodString;
            serverId: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>>;
        birthdayChannelId: z.ZodNullable<z.ZodString>;
        birthdayTimezone: z.ZodNullable<z.ZodString>;
        birthdayMessageTemplate: z.ZodNullable<z.ZodString>;
        birthdayEventNameTemplate: z.ZodNullable<z.ZodString>;
        birthdayEventDescriptionTemplate: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    serverDataDiscord: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        icon: z.ZodNullable<z.ZodString>;
        ownerId: z.ZodString;
        ownerName: z.ZodString;
        ownerNick: z.ZodNullable<z.ZodString>;
        memberCount: z.ZodNumber;
        roles: z.ZodNullable<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            color: z.ZodString;
            icon: z.ZodNullable<z.ZodString>;
            managed: z.ZodBoolean;
            meInRole: z.ZodBoolean;
        }, z.core.$strip>>>;
        channels: z.ZodNullable<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ServerData = z.infer<typeof ServerData>;
declare const MyDataInServer: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    nick: z.ZodNullable<z.ZodString>;
    avatar: z.ZodNullable<z.ZodString>;
    roles: z.ZodNullable<z.ZodArray<z.ZodObject<{
        serverId: z.ZodString;
        roleId: z.ZodString;
        roleCategoryId: z.ZodNullable<z.ZodNumber>;
        selfAssignable: z.ZodBoolean;
        description: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>;
    joined_at: z.ZodString;
}, z.core.$strip>;
export type MyDataInServer = z.infer<typeof MyDataInServer>;
declare const AuthData: z.ZodObject<{
    discord_access_token: z.ZodString;
    discord_refresh_token: z.ZodString;
}, z.core.$strip>;
export type AuthData = z.infer<typeof AuthData>;
declare const ToastProps: z.ZodObject<{
    type: z.ZodNullable<z.ZodEnum<{
        success: "success";
        error: "error";
        info: "info";
    }>>;
}, z.core.$strip>;
export type ToastProps = z.infer<typeof ToastProps>;
declare const ToastObject: z.ZodObject<{
    idx: z.ZodNumber;
    message: z.ZodString;
    type: "object";
}, z.core.$strip>;
export type ToastObject = z.infer<typeof ToastObject>;
declare const MessageOnSuccess: z.ZodObject<{
    detail: z.ZodString;
}, z.core.$strip>;
export type MessageOnSuccess = z.infer<typeof MessageOnSuccess>;
declare const SyncRolesResponse: z.ZodObject<{
    roles_created: z.ZodArray<z.ZodString>;
    roles_deleted: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SyncRolesResponse = z.infer<typeof SyncRolesResponse>;
declare const CreateServerResponse: z.ZodObject<{
    serverId: z.ZodString;
    createdAt: z.ZodDate;
    verificationRequired: z.ZodBoolean;
}, z.core.$strip>;
export type CreateServerResponse = z.infer<typeof CreateServerResponse>;
declare const CreateGameDBParams: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export type CreateGameDBParams = z.infer<typeof CreateGameDBParams>;
export declare const CreateGameRequestBody: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
declare const CreateGameResponse: z.ZodObject<{
    gameId: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    categoryId: z.ZodNullable<z.ZodNumber>;
    serverId: z.ZodString;
    thumbnail: z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>;
    channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateGameResponse = z.infer<typeof CreateGameResponse>;
export declare const UpdateGameRequestBody: z.ZodObject<{
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
    channels: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    tagIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
    roleIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const UpdateGameRequestBodyWithImageAsBuffer: z.ZodObject<{
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
    channels: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    tagIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
    roleIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const UpdateGameResponse: z.ZodObject<{
    updatedGame: z.ZodNullable<z.ZodObject<{
        gameId: z.ZodNumber;
        serverId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
        channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    tags: z.ZodObject<{
        added: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            tagId: z.ZodNumber;
        }, z.core.$strip>>>;
        removed: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            tagId: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    roles: z.ZodObject<{
        added: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            roleId: z.ZodString;
        }, z.core.$strip>>>;
        removed: z.ZodNullable<z.ZodArray<z.ZodObject<{
            gameId: z.ZodNumber;
            roleId: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UpdateGameResponse = z.infer<typeof UpdateGameResponse>;
export declare const DeleteGameRequestBody: z.ZodObject<{
    gameId: z.ZodNumber;
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const CreateTagRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const GetAllTagsInServerRequestBody: z.ZodObject<{
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const DeleteTagRequestBody: z.ZodObject<{
    tagId: z.ZodNumber;
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const CreateRoleInDbRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    roleId: z.ZodString;
}, z.core.$strip>;
export declare const CreateCategoryRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const CreateRoleCategoryRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const AddCategoryToGameRequestBody: z.ZodObject<{
    categoryId: z.ZodNumber;
}, z.core.$strip>;
export declare const ModifyTagsOfGameRequestBody: z.ZodObject<{
    tagIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
export declare const UpdateGameThumbnailRequestBody: z.ZodObject<{
    file: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
}, z.core.$strip>;
export declare const NameRequiredRequestBody: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const AssignRoleCategoryToRoleRequestBody: z.ZodObject<{
    roleCategoryId: z.ZodNullable<z.ZodNumber>;
    roleId: z.ZodString;
}, z.core.$strip>;
export declare const SetRoleSelfAssignableRequestBody: z.ZodObject<{
    selfAssignable: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const GuildMember: z.ZodObject<{
    avatarURL: z.ZodNullable<z.ZodString>;
    bannerURL: z.ZodNullable<z.ZodString>;
    displayAvatarURL: z.ZodNullable<z.ZodString>;
    displayBannerURL: z.ZodNullable<z.ZodString>;
    avatarDecorationURL: z.ZodNullable<z.ZodString>;
    roles: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type GuildMember = z.infer<typeof GuildMember> & DiscordJSGuildMember;
export declare const UpdateServerVerificationRequiredRequestBody: z.ZodObject<{
    verificationRequired: z.ZodBoolean;
}, z.core.$strip>;
export declare function isValidMonthDay(month: number, day: number): boolean;
export declare const UpdateBirthdayRequestBody: z.ZodObject<{
    month: z.ZodNumber;
    day: z.ZodNumber;
}, z.core.$strip>;
export type UpdateBirthdayRequestBody = z.infer<typeof UpdateBirthdayRequestBody>;
declare const GetBirthdayResponse: z.ZodNullable<z.ZodObject<{
    month: z.ZodNumber;
    day: z.ZodNumber;
    editable: z.ZodBoolean;
    editableUntil: z.ZodString;
}, z.core.$strip>>;
export type GetBirthdayResponse = z.infer<typeof GetBirthdayResponse>;
export declare const UpdateServerBirthdayConfigRequestBody: z.ZodObject<{
    channelId: z.ZodNullable<z.ZodString>;
    timezone: z.ZodNullable<z.ZodString>;
    messageTemplate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    eventNameTemplate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    eventDescriptionTemplate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type UpdateServerBirthdayConfigRequestBody = z.infer<typeof UpdateServerBirthdayConfigRequestBody>;
export {};
