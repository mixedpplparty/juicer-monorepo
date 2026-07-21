//! Shared API types. Source of truth for the TypeScript types in
//! `src/shared/src/types/generated/` — regenerate with `cargo test export_bindings`.
use serde::{Deserialize, Serialize};
use ts_rs::TS;

// ---------- DB entities ----------

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct CreateServerResponse {
    #[sqlx(rename = "server_id")]
    pub server_id: String,
    #[sqlx(rename = "created_at")]
    #[ts(type = "string")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    #[sqlx(rename = "verification_required")]
    pub verification_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct Category {
    pub category_id: i32,
    pub server_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct RoleCategory {
    pub role_category_id: i32,
    pub server_id: String,
    pub name: String,
    /// Marks the server's distinct verification role category (PR #44 review /
    /// issue #45) — replaces the old "roleCategoryId === 1" convention.
    pub is_verification: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct Tag {
    pub tag_id: i32,
    pub name: String,
    pub server_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct Role {
    pub server_id: String,
    pub role_id: String,
    pub role_category_id: Option<i32>,
    pub self_assignable: bool,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct TagRelationToGame {
    pub game_id: i32,
    pub tag_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct RoleRelationToGame {
    pub game_id: i32,
    pub role_id: String,
}

/// Game row without the junction-table relations. The heavy `thumbnail` bytea is
/// never included in list payloads (served via the dedicated thumbnail endpoint),
/// so it is always `null` here except straight after an update that returned it.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct GameWithoutRelations {
    pub game_id: i32,
    pub server_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub category_id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional, type = "Array<number> | null")]
    pub thumbnail: Option<Option<Vec<u8>>>,
    pub channels: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct Game {
    #[serde(flatten)]
    #[ts(flatten)]
    pub game: GameWithoutRelations,
    pub games_tags: Option<Vec<TagRelationToGame>>,
    pub games_roles: Option<Vec<RoleRelationToGame>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ServerDataDb {
    pub server_id: String,
    #[ts(type = "string")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub verification_required: bool,
    pub games: Option<Vec<Game>>,
    pub roles: Option<Vec<Role>>,
    pub categories: Option<Vec<Category>>,
    pub role_categories: Option<Vec<RoleCategory>>,
    pub tags: Option<Vec<Tag>>,
}

// ---------- Discord-derived types ----------

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct FilteredGuild {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub owner_id: String,
    pub owner_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub owner_nick: Option<String>,
    pub member_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ServerDataDiscordRole2 {
    pub id: String,
    pub name: String,
    /// hex color in #ABCDEF
    pub color: String,
    pub icon: Option<String>,
    pub managed: bool,
    pub me_in_role: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ServerDataDiscordChannel {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct FilteredServerDataDiscord {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub owner_id: String,
    pub owner_name: String,
    pub owner_nick: Option<String>,
    pub member_count: i64,
    pub roles: Option<Vec<ServerDataDiscordRole2>>,
    pub channels: Option<Vec<ServerDataDiscordChannel>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ServerData {
    pub admin: bool,
    pub server_data_db: Option<ServerDataDb>,
    pub server_data_discord: FilteredServerDataDiscord,
}

/// Raw Discord user object (`/users/@me`) passed through untouched.
pub type ApiUser = serde_json::Value;

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct MyInfo {
    #[ts(type = "any")]
    pub user_data: ApiUser,
    pub guilds: Vec<FilteredGuild>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ServerMemberRole {
    pub role_id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct CategorizedRoleGroup {
    pub role_category_id: Option<i32>,
    pub role_category_name: Option<String>,
    pub roles: Vec<ServerMemberRole>,
}

/// Shape the client consumes from `GET /discord/servers/:serverId/me`.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct MyDataInServer {
    pub id: String,
    pub display_name: String,
    #[serde(rename = "displayAvatarURL")]
    #[ts(rename = "displayAvatarURL")]
    pub display_avatar_url: String,
    pub categorized_roles: Vec<CategorizedRoleGroup>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct TopicDetailsChannel {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct TopicDetailsRole {
    pub id: String,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub self_assignable: bool,
    pub assigned: bool,
}

/// Shape the client consumes from `GET /discord/servers/:serverId/games/:gameId`.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct TopicDetails {
    pub game_id: i32,
    pub server_id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<Category>,
    pub channels: Vec<TopicDetailsChannel>,
    pub roles: Vec<TopicDetailsRole>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct SyncRolesResponse {
    pub roles_created: Vec<String>,
    pub roles_deleted: Vec<String>,
}

/// Kept for the exported TS bindings even though the Rust side responds with
/// ad-hoc json! bodies.
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct MessageOnSuccess {
    pub detail: String,
}

// ---------- Request bodies ----------

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct CreateGameRequestBody {
    pub name: String,
    #[serde(default)]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub category_id: Option<i32>,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct UpdateGameRequestBody {
    #[serde(default)]
    #[ts(optional)]
    pub name: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(default)]
    #[ts(optional)]
    pub category_id: Option<i32>,
    #[serde(default)]
    #[ts(optional)]
    pub channels: Option<Vec<String>>,
    #[serde(default)]
    #[ts(optional)]
    pub tag_ids: Option<Vec<i32>>,
    #[serde(default)]
    #[ts(optional)]
    pub role_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct UpdateGameResponse {
    pub updated_game: Option<GameWithoutRelations>,
    pub tags: AddedRemovedTags,
    pub roles: AddedRemovedRoles,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct AddedRemovedTags {
    pub added: Option<Vec<TagRelationToGame>>,
    pub removed: Option<Vec<TagRelationToGame>>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct AddedRemovedRoles {
    pub added: Option<Vec<RoleRelationToGame>>,
    pub removed: Option<Vec<RoleRelationToGame>>,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct NameRequiredRequestBody {
    pub name: String,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct AddCategoryToGameRequestBody {
    pub category_id: i32,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct ModifyTagsOfGameRequestBody {
    pub tag_ids: Vec<i32>,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct AssignRoleCategoryToRoleRequestBody {
    pub role_category_id: Option<i32>,
    pub role_id: String,
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct SetRoleSelfAssignableRequestBody {
    #[serde(default)]
    #[ts(optional)]
    pub self_assignable: Option<bool>,
    /// Double option: absent -> keep current value, JSON null -> clear
    /// (mirrors drizzle skipping `undefined` but writing `null`).
    #[serde(default, deserialize_with = "double_option")]
    #[ts(optional, type = "string | null")]
    pub description: Option<Option<String>>,
}

/// PATCH /roles/{roleId} body — absent fields are left unchanged; a JSON null
/// clears (roleCategoryId/description). Unknown keys are rejected like the
/// strict zod schema on the old backend.
#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct UpdateRoleSettingsRequest {
    #[serde(default, deserialize_with = "double_option")]
    #[ts(optional, type = "number | null")]
    pub role_category_id: Option<Option<i32>>,
    #[serde(default)]
    #[ts(optional)]
    pub self_assignable: Option<bool>,
    #[serde(default, deserialize_with = "double_option")]
    #[ts(optional, type = "string | null")]
    pub description: Option<Option<String>>,
}

/// Deserialize a present-but-possibly-null field into `Some(inner)`, so
/// `#[serde(default)]` (`None`) marks the field as absent.
fn double_option<'de, T, D>(de: D) -> std::result::Result<Option<Option<T>>, D::Error>
where
    T: serde::Deserialize<'de>,
    D: serde::Deserializer<'de>,
{
    serde::Deserialize::deserialize(de).map(Some)
}

#[derive(Debug, Clone, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../shared/src/types/generated/")]
pub struct UpdateServerVerificationRequiredRequestBody {
    pub verification_required: bool,
}
