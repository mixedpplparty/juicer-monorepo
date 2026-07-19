//! All Postgres queries — port of `../server/src/functions/db.ts`.
//!
//! Runtime sqlx queries only (no `query!` macros). Per-function behavior,
//! including thrown statuses and messages, mirrors the TS implementation.

use std::collections::HashMap;

use sqlx::postgres::PgRow;
use sqlx::{PgPool, Postgres, QueryBuilder, Row};

use crate::error::{HttpError, Result};
use crate::models::*;

/// Postgres SQLSTATE for unique constraint violations.
const PG_UNIQUE_VIOLATION: &str = "23505";
/// Postgres SQLSTATE for not-null constraint violations.
const PG_NOT_NULL_VIOLATION: &str = "23502";

/// Extract the SQLSTATE code from a sqlx error, if it is a database error.
fn pg_error_code(err: &sqlx::Error) -> Option<String> {
    match err {
        sqlx::Error::Database(db_err) => db_err.code().map(|c| c.into_owned()),
        _ => None,
    }
}

// ---------- row mappers ----------

/// Map a `servers` row. `created_at` is a `timestamp` (no tz) column, so it
/// decodes as `NaiveDateTime` and is interpreted as UTC.
fn map_server_row(row: &PgRow) -> sqlx::Result<CreateServerResponse> {
    let created_at: chrono::NaiveDateTime = row.try_get("created_at")?;
    Ok(CreateServerResponse {
        server_id: row.try_get("server_id")?,
        created_at: created_at.and_utc(),
        verification_required: row.try_get("verification_required")?,
    })
}

/// Map a `games` row that was selected WITHOUT the thumbnail column.
/// `thumbnail` is `None` (absent from the JSON payload).
fn map_game_row_no_thumbnail(row: &PgRow) -> sqlx::Result<GameWithoutRelations> {
    Ok(GameWithoutRelations {
        game_id: row.try_get("game_id")?,
        server_id: row.try_get("server_id")?,
        name: row.try_get("name")?,
        description: Some(row.try_get::<Option<String>, _>("description")?),
        category_id: Some(row.try_get::<Option<i32>, _>("category_id")?),
        thumbnail: None,
        channels: row.try_get("channels")?,
    })
}

/// Map a `games` row that includes the thumbnail column (RETURNING * paths —
/// the TS code serialized the full returned row).
fn map_game_row_with_thumbnail(row: &PgRow) -> sqlx::Result<GameWithoutRelations> {
    Ok(GameWithoutRelations {
        game_id: row.try_get("game_id")?,
        server_id: row.try_get("server_id")?,
        name: row.try_get("name")?,
        description: Some(row.try_get::<Option<String>, _>("description")?),
        category_id: Some(row.try_get::<Option<i32>, _>("category_id")?),
        thumbnail: Some(row.try_get::<Option<Vec<u8>>, _>("thumbnail")?),
        channels: row.try_get("channels")?,
    })
}

const GAME_COLUMNS_NO_THUMBNAIL: &str = "game_id, server_id, category_id, name, description, channels";
const GAME_COLUMNS_WITH_THUMBNAIL: &str =
    "game_id, server_id, category_id, name, description, thumbnail, channels";

/// Load `games_tags`/`games_roles` for the given games (separate queries,
/// grouped in Rust — mirrors drizzle's relational `with` loading, which always
/// yields an array, so relations are `Some(vec![])` when empty).
async fn attach_game_relations(
    db: &PgPool,
    games: Vec<GameWithoutRelations>,
) -> Result<Vec<Game>> {
    if games.is_empty() {
        return Ok(Vec::new());
    }
    let game_ids: Vec<i32> = games.iter().map(|g| g.game_id).collect();

    let tag_rels: Vec<TagRelationToGame> =
        sqlx::query_as("SELECT game_id, tag_id FROM games_tags WHERE game_id = ANY($1)")
            .bind(&game_ids)
            .fetch_all(db)
            .await?;
    let role_rels: Vec<RoleRelationToGame> =
        sqlx::query_as("SELECT game_id, role_id FROM games_roles WHERE game_id = ANY($1)")
            .bind(&game_ids)
            .fetch_all(db)
            .await?;

    let mut tags_by_game: HashMap<i32, Vec<TagRelationToGame>> = HashMap::new();
    for rel in tag_rels {
        tags_by_game.entry(rel.game_id).or_default().push(rel);
    }
    let mut roles_by_game: HashMap<i32, Vec<RoleRelationToGame>> = HashMap::new();
    for rel in role_rels {
        roles_by_game.entry(rel.game_id).or_default().push(rel);
    }

    Ok(games
        .into_iter()
        .map(|game| {
            let game_id = game.game_id;
            Game {
                game,
                games_tags: Some(tags_by_game.remove(&game_id).unwrap_or_default()),
                games_roles: Some(roles_by_game.remove(&game_id).unwrap_or_default()),
            }
        })
        .collect())
}

// ---------- servers ----------

pub async fn get_server_data_in_db(db: &PgPool, server_id: &str) -> Result<Option<ServerDataDb>> {
    let server_row = sqlx::query(
        "SELECT server_id, created_at, verification_required FROM servers WHERE server_id = $1",
    )
    .bind(server_id)
    .fetch_optional(db)
    .await?;
    let Some(server_row) = server_row else {
        return Ok(None);
    };
    let server = map_server_row(&server_row).map_err(HttpError::from)?;

    let game_rows = sqlx::query(&format!(
        "SELECT {GAME_COLUMNS_NO_THUMBNAIL} FROM games WHERE server_id = $1"
    ))
    .bind(server_id)
    .fetch_all(db)
    .await?;
    let games_without_relations = game_rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    let games = attach_game_relations(db, games_without_relations).await?;

    let categories: Vec<Category> =
        sqlx::query_as("SELECT category_id, server_id, name FROM categories WHERE server_id = $1")
            .bind(server_id)
            .fetch_all(db)
            .await?;
    let tags: Vec<Tag> =
        sqlx::query_as("SELECT tag_id, server_id, name FROM tags WHERE server_id = $1")
            .bind(server_id)
            .fetch_all(db)
            .await?;
    let roles: Vec<Role> = sqlx::query_as(
        "SELECT role_id, server_id, role_category_id, self_assignable, description \
         FROM roles WHERE server_id = $1",
    )
    .bind(server_id)
    .fetch_all(db)
    .await?;
    let role_categories: Vec<RoleCategory> = sqlx::query_as(
        "SELECT role_category_id, server_id, name FROM roles_categories WHERE server_id = $1",
    )
    .bind(server_id)
    .fetch_all(db)
    .await?;

    Ok(Some(ServerDataDb {
        server_id: server.server_id,
        created_at: server.created_at,
        verification_required: server.verification_required,
        games: Some(games),
        roles: Some(roles),
        categories: Some(categories),
        role_categories: Some(role_categories),
        tags: Some(tags),
    }))
}

pub async fn create_server(db: &PgPool, server_id: &str) -> Result<CreateServerResponse> {
    let row = sqlx::query(
        "INSERT INTO servers (server_id) VALUES ($1) \
         RETURNING server_id, created_at, verification_required",
    )
    .bind(server_id)
    .fetch_one(db)
    .await;
    match row {
        Ok(row) => map_server_row(&row).map_err(HttpError::from),
        Err(err) => {
            tracing::error!(error = %err, "Error while creating server.");
            if pg_error_code(&err).as_deref() == Some(PG_UNIQUE_VIOLATION) {
                return Err(HttpError::bad_request("Server already exists."));
            }
            Err(HttpError::internal("Unknown error while creating server."))
        }
    }
}

pub async fn update_server_verification_required(
    db: &PgPool,
    server_id: &str,
    verification_required: bool,
) -> Result<Vec<CreateServerResponse>> {
    let rows = sqlx::query(
        "UPDATE servers SET verification_required = $2 WHERE server_id = $1 \
         RETURNING server_id, created_at, verification_required",
    )
    .bind(server_id)
    .bind(verification_required)
    .fetch_all(db)
    .await?;
    rows.iter()
        .map(map_server_row)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)
}

// ---------- games ----------

pub async fn create_game(
    db: &PgPool,
    server_id: &str,
    name: &str,
    description: Option<&str>,
    category_id: Option<i32>,
) -> Result<GameWithoutRelations> {
    let row = sqlx::query(&format!(
        "INSERT INTO games (server_id, name, description, category_id) \
         VALUES ($1, $2, $3, $4) RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(server_id)
    .bind(name)
    .bind(description)
    .bind(category_id)
    .fetch_one(db)
    .await;
    match row {
        Ok(row) => map_game_row_with_thumbnail(&row).map_err(HttpError::from),
        Err(err) => {
            tracing::error!(error = %err, "Error while creating game.");
            if pg_error_code(&err).as_deref() == Some(PG_NOT_NULL_VIOLATION) {
                return Err(HttpError::bad_request("Values violated Not Null constraint."));
            }
            Err(HttpError::internal("Unknown error while creating game."))
        }
    }
}

pub struct UpdateGameParams {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<i32>,
    pub thumbnail: Option<Vec<u8>>,
    pub channels: Option<Vec<String>>,
    pub tag_ids: Option<Vec<i32>>,
    pub role_ids: Option<Vec<String>>,
}

pub async fn update_game(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
    params: UpdateGameParams,
) -> Result<UpdateGameResponse> {
    let mut res = UpdateGameResponse {
        updated_game: None,
        tags: AddedRemovedTags { added: None, removed: None },
        roles: AddedRemovedRoles { added: None, removed: None },
    };

    let game_exists = sqlx::query("SELECT game_id FROM games WHERE game_id = $1 AND server_id = $2")
        .bind(game_id)
        .bind(server_id)
        .fetch_optional(db)
        .await?;
    if game_exists.is_none() {
        return Err(HttpError::not_found("Game not found."));
    }
    let existing_tag_ids: Vec<i32> =
        sqlx::query_scalar("SELECT tag_id FROM games_tags WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(db)
            .await?;
    let existing_role_ids: Vec<String> =
        sqlx::query_scalar("SELECT role_id FROM games_roles WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(db)
            .await?;

    let mut tx = db.begin().await?;

    // Only update fields that were provided (mirrors the TS null/undefined filter).
    let has_update_fields = params.name.is_some()
        || params.description.is_some()
        || params.category_id.is_some()
        || params.thumbnail.is_some()
        || params.channels.is_some();
    if has_update_fields {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE games SET ");
        let mut fields = qb.separated(", ");
        if let Some(name) = &params.name {
            fields.push("name = ");
            fields.push_bind_unseparated(name);
        }
        if let Some(description) = &params.description {
            fields.push("description = ");
            fields.push_bind_unseparated(description);
        }
        if let Some(category_id) = params.category_id {
            fields.push("category_id = ");
            fields.push_bind_unseparated(category_id);
        }
        if let Some(thumbnail) = &params.thumbnail {
            fields.push("thumbnail = ");
            fields.push_bind_unseparated(thumbnail);
        }
        if let Some(channels) = &params.channels {
            fields.push("channels = ");
            fields.push_bind_unseparated(channels);
        }
        qb.push(" WHERE game_id = ");
        qb.push_bind(game_id);
        qb.push(" AND server_id = ");
        qb.push_bind(server_id);
        qb.push(format!(" RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"));

        let updated_rows = qb.build().fetch_all(&mut *tx).await?;
        if let Some(row) = updated_rows.first() {
            res.updated_game = Some(map_game_row_with_thumbnail(row).map_err(HttpError::from)?);
        }
    }

    // Tags diff. NOTE: mirrors the TS exactly — when `tag_ids` is None, every
    // existing tag is removed, and the delete filters ONLY on tag_id.
    let tags_to_add: Vec<i32> = match &params.tag_ids {
        Some(tag_ids) => tag_ids
            .iter()
            .copied()
            .filter(|tag_id| !existing_tag_ids.contains(tag_id))
            .collect(),
        None => Vec::new(),
    };
    let tags_to_remove: Vec<i32> = existing_tag_ids
        .iter()
        .copied()
        .filter(|tag_id| !params.tag_ids.as_ref().is_some_and(|ids| ids.contains(tag_id)))
        .collect();
    if !tags_to_add.is_empty() {
        let mut qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO games_tags (game_id, tag_id) ");
        qb.push_values(tags_to_add.iter(), |mut b, tag_id| {
            b.push_bind(game_id);
            b.push_bind(*tag_id);
        });
        qb.push(" RETURNING game_id, tag_id");
        let rows = qb.build().fetch_all(&mut *tx).await?;
        let added = rows
            .iter()
            .map(|row| {
                Ok(TagRelationToGame {
                    game_id: row.try_get("game_id")?,
                    tag_id: row.try_get("tag_id")?,
                })
            })
            .collect::<sqlx::Result<Vec<_>>>()
            .map_err(HttpError::from)?;
        res.tags.added = Some(added);
    }
    if !tags_to_remove.is_empty() {
        let rows = sqlx::query(
            "DELETE FROM games_tags WHERE tag_id = ANY($1) RETURNING game_id, tag_id",
        )
        .bind(&tags_to_remove)
        .fetch_all(&mut *tx)
        .await?;
        let removed = rows
            .iter()
            .map(|row| {
                Ok(TagRelationToGame {
                    game_id: row.try_get("game_id")?,
                    tag_id: row.try_get("tag_id")?,
                })
            })
            .collect::<sqlx::Result<Vec<_>>>()
            .map_err(HttpError::from)?;
        res.tags.removed = Some(removed);
    }

    // Roles diff — same semantics as tags.
    let roles_to_add: Vec<String> = match &params.role_ids {
        Some(role_ids) => role_ids
            .iter()
            .filter(|role_id| !existing_role_ids.contains(role_id))
            .cloned()
            .collect(),
        None => Vec::new(),
    };
    let roles_to_remove: Vec<String> = existing_role_ids
        .iter()
        .filter(|role_id| !params.role_ids.as_ref().is_some_and(|ids| ids.contains(role_id)))
        .cloned()
        .collect();
    if !roles_to_add.is_empty() {
        let mut qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO games_roles (game_id, role_id) ");
        qb.push_values(roles_to_add.iter(), |mut b, role_id| {
            b.push_bind(game_id);
            b.push_bind(role_id);
        });
        qb.push(" RETURNING game_id, role_id");
        let rows = qb.build().fetch_all(&mut *tx).await?;
        let added = rows
            .iter()
            .map(|row| {
                Ok(RoleRelationToGame {
                    game_id: row.try_get("game_id")?,
                    role_id: row.try_get("role_id")?,
                })
            })
            .collect::<sqlx::Result<Vec<_>>>()
            .map_err(HttpError::from)?;
        res.roles.added = Some(added);
    }
    if !roles_to_remove.is_empty() {
        let rows = sqlx::query(
            "DELETE FROM games_roles WHERE role_id = ANY($1) RETURNING game_id, role_id",
        )
        .bind(&roles_to_remove)
        .fetch_all(&mut *tx)
        .await?;
        let removed = rows
            .iter()
            .map(|row| {
                Ok(RoleRelationToGame {
                    game_id: row.try_get("game_id")?,
                    role_id: row.try_get("role_id")?,
                })
            })
            .collect::<sqlx::Result<Vec<_>>>()
            .map_err(HttpError::from)?;
        res.roles.removed = Some(removed);
    }

    tx.commit().await?;
    Ok(res)
}

pub async fn delete_game(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
) -> Result<GameWithoutRelations> {
    let game_exists = sqlx::query("SELECT game_id FROM games WHERE game_id = $1 AND server_id = $2")
        .bind(game_id)
        .bind(server_id)
        .fetch_optional(db)
        .await?;
    if game_exists.is_none() {
        return Err(HttpError::not_found("Game not found."));
    }
    let row = sqlx::query(&format!(
        "DELETE FROM games WHERE game_id = $1 AND server_id = $2 \
         RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(game_id)
    .bind(server_id)
    .fetch_one(db)
    .await?;
    map_game_row_with_thumbnail(&row).map_err(HttpError::from)
}

pub async fn map_category_to_game(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
    category_id: i32,
) -> Result<Vec<GameWithoutRelations>> {
    let rows = sqlx::query(&format!(
        "UPDATE games SET category_id = $3 WHERE game_id = $1 AND server_id = $2 \
         RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(game_id)
    .bind(server_id)
    .bind(category_id)
    .fetch_all(db)
    .await?;
    rows.iter()
        .map(map_game_row_with_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)
}

pub async fn get_all_games_in_server(db: &PgPool, server_id: &str) -> Result<Vec<Game>> {
    let rows = sqlx::query(&format!(
        "SELECT {GAME_COLUMNS_NO_THUMBNAIL} FROM games WHERE server_id = $1"
    ))
    .bind(server_id)
    .fetch_all(db)
    .await?;
    let games = rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    attach_game_relations(db, games).await
}

pub async fn find_games_by_category_name(
    db: &PgPool,
    server_id: &str,
    category_name: &str,
) -> Result<Vec<Game>> {
    let category_id: Option<i32> = sqlx::query_scalar(
        "SELECT category_id FROM categories WHERE server_id = $1 AND name = $2 LIMIT 1",
    )
    .bind(server_id)
    .bind(category_name)
    .fetch_optional(db)
    .await?;
    let Some(category_id) = category_id else {
        return Ok(Vec::new());
    };
    let rows = sqlx::query(&format!(
        "SELECT {GAME_COLUMNS_NO_THUMBNAIL} FROM games \
         WHERE server_id = $1 AND category_id = $2"
    ))
    .bind(server_id)
    .bind(category_id)
    .fetch_all(db)
    .await?;
    let games = rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    attach_game_relations(db, games).await
}

pub async fn find_games_by_tags(
    db: &PgPool,
    server_id: &str,
    tag_names: &[String],
) -> Result<Vec<Game>> {
    let tag_ids: Vec<i32> =
        sqlx::query_scalar("SELECT tag_id FROM tags WHERE server_id = $1 AND name = ANY($2)")
            .bind(server_id)
            .bind(tag_names)
            .fetch_all(db)
            .await?;
    if tag_ids.is_empty() {
        return Ok(Vec::new());
    }
    let rows = sqlx::query("SELECT DISTINCT g.game_id, g.server_id, g.category_id, g.name, g.description, g.channels \
         FROM games g \
         JOIN games_tags gt ON gt.game_id = g.game_id \
         WHERE g.server_id = $1 AND gt.tag_id = ANY($2)")
    .bind(server_id)
    .bind(&tag_ids)
    .fetch_all(db)
    .await?;
    let games = rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    attach_game_relations(db, games).await
}

pub async fn find_games_by_name(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Game>> {
    let pattern = format!("%{name}%");
    let rows = sqlx::query(&format!(
        "SELECT {GAME_COLUMNS_NO_THUMBNAIL} FROM games \
         WHERE server_id = $1 AND name ILIKE $2"
    ))
    .bind(server_id)
    .bind(pattern)
    .fetch_all(db)
    .await?;
    let games = rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    attach_game_relations(db, games).await
}

pub async fn update_game_thumbnail(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
    thumbnail: &[u8],
) -> Result<Vec<GameWithoutRelations>> {
    let rows = sqlx::query(&format!(
        "UPDATE games SET thumbnail = $3 WHERE game_id = $1 AND server_id = $2 \
         RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(game_id)
    .bind(server_id)
    .bind(thumbnail)
    .fetch_all(db)
    .await?;
    rows.iter()
        .map(map_game_row_with_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)
}

pub async fn get_game_thumbnail(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
) -> Result<Option<Vec<u8>>> {
    let thumbnail: Option<Option<Vec<u8>>> =
        sqlx::query_scalar("SELECT thumbnail FROM games WHERE game_id = $1 AND server_id = $2")
            .bind(game_id)
            .bind(server_id)
            .fetch_optional(db)
            .await?;
    Ok(thumbnail.flatten())
}

// ---------- tags ----------

pub async fn create_tag(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Tag>> {
    let existing: Option<Tag> = sqlx::query_as(
        "SELECT tag_id, server_id, name FROM tags WHERE server_id = $1 AND name = $2 LIMIT 1",
    )
    .bind(server_id)
    .bind(name)
    .fetch_optional(db)
    .await?;
    if let Some(tag) = existing {
        return Ok(vec![tag]);
    }
    let created: Vec<Tag> = sqlx::query_as(
        "INSERT INTO tags (server_id, name) VALUES ($1, $2) RETURNING tag_id, server_id, name",
    )
    .bind(server_id)
    .bind(name)
    .fetch_all(db)
    .await?;
    Ok(created)
}

pub async fn get_all_tags_in_server(db: &PgPool, server_id: &str) -> Result<Vec<Tag>> {
    let tags: Vec<Tag> =
        sqlx::query_as("SELECT tag_id, server_id, name FROM tags WHERE server_id = $1")
            .bind(server_id)
            .fetch_all(db)
            .await?;
    Ok(tags)
}

pub async fn delete_tag(db: &PgPool, tag_id: i32, server_id: &str) -> Result<Vec<Tag>> {
    let deleted: Vec<Tag> = sqlx::query_as(
        "DELETE FROM tags WHERE tag_id = $1 AND server_id = $2 RETURNING tag_id, server_id, name",
    )
    .bind(tag_id)
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok(deleted)
}

// ---------- roles ----------

pub async fn create_role_in_db(db: &PgPool, server_id: &str, role_id: &str) -> Result<Vec<Role>> {
    let created: std::result::Result<Vec<Role>, sqlx::Error> = sqlx::query_as(
        "INSERT INTO roles (server_id, role_id) VALUES ($1, $2) \
         RETURNING role_id, server_id, role_category_id, self_assignable, description",
    )
    .bind(server_id)
    .bind(role_id)
    .fetch_all(db)
    .await;
    match created {
        Ok(roles) => Ok(roles),
        // Swallow unique violations (role already registered) like the TS code.
        Err(err) if pg_error_code(&err).as_deref() == Some(PG_UNIQUE_VIOLATION) => Ok(Vec::new()),
        Err(err) => Err(err.into()),
    }
}

pub async fn get_all_roles_in_server_in_db(db: &PgPool, server_id: &str) -> Result<Vec<Role>> {
    let roles: Vec<Role> = sqlx::query_as(
        "SELECT role_id, server_id, role_category_id, self_assignable, description \
         FROM roles WHERE server_id = $1",
    )
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok(roles)
}

pub async fn get_roles_in_server_in_db_by_role_ids(
    db: &PgPool,
    server_id: &str,
    role_ids: &[String],
) -> Result<Vec<Role>> {
    let roles: Vec<Role> = sqlx::query_as(
        "SELECT role_id, server_id, role_category_id, self_assignable, description \
         FROM roles WHERE role_id = ANY($1) AND server_id = $2",
    )
    .bind(role_ids)
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok(roles)
}

pub async fn delete_role_from_db(db: &PgPool, server_id: &str, role_id: &str) -> Result<()> {
    sqlx::query("DELETE FROM roles WHERE role_id = $1 AND server_id = $2")
        .bind(role_id)
        .bind(server_id)
        .execute(db)
        .await?;
    sqlx::query("DELETE FROM games_roles WHERE role_id = $1")
        .bind(role_id)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn update_role_info(
    db: &PgPool,
    role_id: &str,
    server_id: &str,
    self_assignable: Option<bool>,
    description: Option<Option<String>>,
) -> Result<Vec<Role>> {
    // undefined/null selfAssignable defaults to false (mirrors TS); an absent
    // description is left untouched, while an explicit JSON null clears it
    // (drizzle skips undefined fields but writes null).
    let self_assignable = self_assignable.unwrap_or(false);
    let rows: Vec<Role> = if let Some(description) = description {
        sqlx::query_as(
            "UPDATE roles SET self_assignable = $3, description = $4 \
             WHERE role_id = $1 AND server_id = $2 \
             RETURNING role_id, server_id, role_category_id, self_assignable, description",
        )
        .bind(role_id)
        .bind(server_id)
        .bind(self_assignable)
        .bind(description)
        .fetch_all(db)
        .await?
    } else {
        sqlx::query_as(
            "UPDATE roles SET self_assignable = $3 \
             WHERE role_id = $1 AND server_id = $2 \
             RETURNING role_id, server_id, role_category_id, self_assignable, description",
        )
        .bind(role_id)
        .bind(server_id)
        .bind(self_assignable)
        .fetch_all(db)
        .await?
    };
    Ok(rows)
}

// ---------- categories ----------

pub async fn create_category(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Category>> {
    let created: Vec<Category> = sqlx::query_as(
        "INSERT INTO categories (server_id, name) VALUES ($1, $2) \
         RETURNING category_id, server_id, name",
    )
    .bind(server_id)
    .bind(name)
    .fetch_all(db)
    .await?;
    Ok(created)
}

pub async fn delete_category(
    db: &PgPool,
    category_id: i32,
    server_id: &str,
) -> Result<Vec<Category>> {
    let deleted: Vec<Category> = sqlx::query_as(
        "DELETE FROM categories WHERE category_id = $1 AND server_id = $2 \
         RETURNING category_id, server_id, name",
    )
    .bind(category_id)
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok(deleted)
}

// ---------- role categories ----------

pub async fn create_role_category(
    db: &PgPool,
    server_id: &str,
    name: &str,
) -> Result<Vec<RoleCategory>> {
    let created: Vec<RoleCategory> = sqlx::query_as(
        "INSERT INTO roles_categories (server_id, name) VALUES ($1, $2) \
         RETURNING role_category_id, server_id, name",
    )
    .bind(server_id)
    .bind(name)
    .fetch_all(db)
    .await?;
    Ok(created)
}

pub async fn delete_role_category(
    db: &PgPool,
    role_category_id: i32,
    server_id: &str,
) -> Result<Vec<RoleCategory>> {
    let deleted: Vec<RoleCategory> = sqlx::query_as(
        "DELETE FROM roles_categories WHERE role_category_id = $1 AND server_id = $2 \
         RETURNING role_category_id, server_id, name",
    )
    .bind(role_category_id)
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok(deleted)
}

pub async fn update_role_category_of_role(
    db: &PgPool,
    role_id: &str,
    role_category_id: Option<i32>,
    server_id: &str,
) -> Result<Vec<Role>> {
    // A single parameterized statement covers both assign (Some) and unassign
    // (None -> NULL), matching the TS branches.
    let rows: Vec<Role> = sqlx::query_as(
        "UPDATE roles SET role_category_id = $3 WHERE role_id = $1 AND server_id = $2 \
         RETURNING role_id, server_id, role_category_id, self_assignable, description",
    )
    .bind(role_id)
    .bind(server_id)
    .bind(role_category_id)
    .fetch_all(db)
    .await?;
    Ok(rows)
}
