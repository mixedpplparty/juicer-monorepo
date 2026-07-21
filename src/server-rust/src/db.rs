//! All Postgres queries — port of `../server/src/functions/db.ts`.
//!
//! Runtime sqlx queries only (no `query!` macros). Per-function behavior,
//! including thrown statuses and messages, mirrors the TS implementation.

use std::collections::HashMap;

use sqlx::postgres::PgRow;
use sqlx::{PgExecutor, PgPool, Postgres, QueryBuilder, Row};

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

    let (tag_rels, role_rels): (Vec<TagRelationToGame>, Vec<RoleRelationToGame>) = tokio::try_join!(
        sqlx::query_as("SELECT game_id, tag_id FROM games_tags WHERE game_id = ANY($1)")
            .bind(&game_ids)
            .fetch_all(db),
        sqlx::query_as("SELECT game_id, role_id FROM games_roles WHERE game_id = ANY($1)")
            .bind(&game_ids)
            .fetch_all(db),
    )?;

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

// ---------- startup schema guard ----------

/// Idempotent: schema is owned by drizzle-kit in `../server`, but this keeps
/// the Rust server bootable against a database migrated before the
/// is_verification column existed, and backfills the flag for legacy servers
/// (their auto-created category is the oldest one named "verification").
pub async fn ensure_verification_category_schema(db: &PgPool) -> Result<()> {
    let mut tx = db.begin().await?;
    sqlx::query(
        "ALTER TABLE roles_categories \
         ADD COLUMN IF NOT EXISTS is_verification boolean NOT NULL DEFAULT false",
    )
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "UPDATE roles_categories SET is_verification = true \
         WHERE role_category_id IN ( \
             SELECT MIN(rc.role_category_id) FROM roles_categories rc \
             WHERE rc.name = 'verification' \
               AND NOT EXISTS ( \
                   SELECT 1 FROM roles_categories flagged \
                   WHERE flagged.server_id = rc.server_id AND flagged.is_verification \
               ) \
             GROUP BY rc.server_id \
         )",
    )
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(())
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

    // The five collection fetches are independent — run them concurrently
    // (each fetch borrows the pool, so they use separate connections). This is
    // the dashboard's main read; sequential round-trips dominated its latency.
    let games_fut = async {
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
        attach_game_relations(db, games_without_relations).await
    };
    let categories_fut = async {
        sqlx::query_as::<_, Category>(
            "SELECT category_id, server_id, name FROM categories WHERE server_id = $1",
        )
        .bind(server_id)
        .fetch_all(db)
        .await
        .map_err(HttpError::from)
    };
    let tags_fut = async {
        sqlx::query_as::<_, Tag>("SELECT tag_id, server_id, name FROM tags WHERE server_id = $1")
            .bind(server_id)
            .fetch_all(db)
            .await
            .map_err(HttpError::from)
    };
    let roles_fut = async {
        sqlx::query_as::<_, Role>(
            "SELECT role_id, server_id, role_category_id, self_assignable, description \
             FROM roles WHERE server_id = $1",
        )
        .bind(server_id)
        .fetch_all(db)
        .await
        .map_err(HttpError::from)
    };
    let role_categories_fut = async {
        sqlx::query_as::<_, RoleCategory>(
            "SELECT role_category_id, server_id, name, is_verification \
             FROM roles_categories WHERE server_id = $1",
        )
        .bind(server_id)
        .fetch_all(db)
        .await
        .map_err(HttpError::from)
    };
    let (games, categories, tags, roles, role_categories) = tokio::try_join!(
        games_fut,
        categories_fut,
        tags_fut,
        roles_fut,
        role_categories_fut
    )?;

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

/// Creates the server row and its verification role category atomically — if
/// either insert fails, neither is kept.
pub async fn create_server_with_verification_category(
    db: &PgPool,
    server_id: &str,
) -> Result<CreateServerResponse> {
    let mut tx = db.begin().await?;
    let row = sqlx::query(
        "INSERT INTO servers (server_id) VALUES ($1) \
         RETURNING server_id, created_at, verification_required",
    )
    .bind(server_id)
    .fetch_one(&mut *tx)
    .await;
    let server = match row {
        Ok(row) => map_server_row(&row).map_err(HttpError::from)?,
        Err(err) => {
            tracing::error!(error = %err, "Error while creating server.");
            if pg_error_code(&err).as_deref() == Some(PG_UNIQUE_VIOLATION) {
                return Err(HttpError::bad_request("Server already exists."));
            }
            return Err(HttpError::internal("Unknown error while creating server."));
        }
    };
    sqlx::query(
        "INSERT INTO roles_categories (server_id, name, is_verification) \
         VALUES ($1, 'verification', true)",
    )
    .bind(server_id)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(server)
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

// FKs only guarantee the referenced rows exist somewhere — these checks pin
// them to the requesting server. Executor-generic so they can run inside the
// caller's transaction and share its snapshot.
async fn ensure_category_belongs_to_server<'e>(
    executor: impl PgExecutor<'e>,
    server_id: &str,
    category_id: i32,
) -> Result<()> {
    let exists: Option<i32> = sqlx::query_scalar(
        "SELECT category_id FROM categories WHERE category_id = $1 AND server_id = $2",
    )
    .bind(category_id)
    .bind(server_id)
    .fetch_optional(executor)
    .await?;
    if exists.is_none() {
        return Err(HttpError::bad_request(
            "Category does not belong to this server.",
        ));
    }
    Ok(())
}

async fn ensure_tags_belong_to_server<'e>(
    executor: impl PgExecutor<'e>,
    server_id: &str,
    tag_ids: &[i32],
) -> Result<()> {
    if tag_ids.is_empty() {
        return Ok(());
    }
    let count: i64 = sqlx::query_scalar(
        "SELECT count(DISTINCT tag_id) FROM tags WHERE server_id = $1 AND tag_id = ANY($2)",
    )
    .bind(server_id)
    .bind(tag_ids)
    .fetch_one(executor)
    .await?;
    let unique: std::collections::HashSet<i32> = tag_ids.iter().copied().collect();
    if count != unique.len() as i64 {
        return Err(HttpError::bad_request(
            "One or more tags do not belong to this server.",
        ));
    }
    Ok(())
}

async fn ensure_roles_belong_to_server<'e>(
    executor: impl PgExecutor<'e>,
    server_id: &str,
    role_ids: &[String],
) -> Result<()> {
    if role_ids.is_empty() {
        return Ok(());
    }
    let count: i64 = sqlx::query_scalar(
        "SELECT count(DISTINCT role_id) FROM roles WHERE server_id = $1 AND role_id = ANY($2)",
    )
    .bind(server_id)
    .bind(role_ids)
    .fetch_one(executor)
    .await?;
    let unique: std::collections::HashSet<&str> =
        role_ids.iter().map(|role_id| role_id.as_str()).collect();
    if count != unique.len() as i64 {
        return Err(HttpError::bad_request(
            "One or more roles are not synced with this server. Sync roles first.",
        ));
    }
    Ok(())
}

pub async fn create_game(
    db: &PgPool,
    server_id: &str,
    name: &str,
    description: Option<&str>,
    category_id: Option<i32>,
) -> Result<GameWithoutRelations> {
    let mut tx = db.begin().await?;
    if let Some(category_id) = category_id {
        ensure_category_belongs_to_server(&mut *tx, server_id, category_id).await?;
    }
    let row = sqlx::query(&format!(
        "INSERT INTO games (server_id, name, description, category_id) \
         VALUES ($1, $2, $3, $4) RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(server_id)
    .bind(name)
    .bind(description)
    .bind(category_id)
    .fetch_one(&mut *tx)
    .await;
    match row {
        Ok(row) => {
            let game = map_game_row_with_thumbnail(&row).map_err(HttpError::from)?;
            tx.commit().await?;
            Ok(game)
        }
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

    // The checks, snapshot, diff and writes all live inside one transaction,
    // with the games row locked FOR UPDATE so concurrent updates to the same
    // game serialize instead of double-inserting relation rows.
    let mut tx = db.begin().await?;
    let game_exists = sqlx::query(
        "SELECT game_id FROM games WHERE game_id = $1 AND server_id = $2 FOR UPDATE",
    )
    .bind(game_id)
    .bind(server_id)
    .fetch_optional(&mut *tx)
    .await?;
    if game_exists.is_none() {
        return Err(HttpError::not_found("Game not found."));
    }
    if let Some(category_id) = params.category_id {
        ensure_category_belongs_to_server(&mut *tx, server_id, category_id).await?;
    }
    if let Some(tag_ids) = &params.tag_ids {
        ensure_tags_belong_to_server(&mut *tx, server_id, tag_ids).await?;
    }
    if let Some(role_ids) = &params.role_ids {
        ensure_roles_belong_to_server(&mut *tx, server_id, role_ids).await?;
    }
    let existing_tag_ids: Vec<i32> =
        sqlx::query_scalar("SELECT tag_id FROM games_tags WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(&mut *tx)
            .await?;
    let existing_role_ids: Vec<String> =
        sqlx::query_scalar("SELECT role_id FROM games_roles WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(&mut *tx)
            .await?;

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

    // Tags diff. An absent `tag_ids` leaves the game's tags untouched (the TS
    // treated absent as "remove everything" — a bug this port fixes; an empty
    // array still clears them deliberately).
    let (tags_to_add, tags_to_remove): (Vec<i32>, Vec<i32>) = match &params.tag_ids {
        Some(tag_ids) => (
            tag_ids
                .iter()
                .copied()
                .filter(|tag_id| !existing_tag_ids.contains(tag_id))
                .collect(),
            existing_tag_ids
                .iter()
                .copied()
                .filter(|tag_id| !tag_ids.contains(tag_id))
                .collect(),
        ),
        None => (Vec::new(), Vec::new()),
    };
    if !tags_to_add.is_empty() {
        let mut qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO games_tags (game_id, tag_id) ");
        qb.push_values(tags_to_add.iter(), |mut b, tag_id| {
            b.push_bind(game_id);
            b.push_bind(*tag_id);
        });
        qb.push(" ON CONFLICT DO NOTHING RETURNING game_id, tag_id");
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
        // Scoped to the game — the TS delete filtered only on tag_id, which
        // silently stripped the tag from every other game sharing it.
        let rows = sqlx::query(
            "DELETE FROM games_tags WHERE game_id = $1 AND tag_id = ANY($2) \
             RETURNING game_id, tag_id",
        )
        .bind(game_id)
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

    // Roles diff — same semantics as tags (absent leaves roles untouched).
    let (roles_to_add, roles_to_remove): (Vec<String>, Vec<String>) = match &params.role_ids {
        Some(role_ids) => (
            role_ids
                .iter()
                .filter(|role_id| !existing_role_ids.contains(role_id))
                .cloned()
                .collect(),
            existing_role_ids
                .iter()
                .filter(|role_id| !role_ids.contains(role_id))
                .cloned()
                .collect(),
        ),
        None => (Vec::new(), Vec::new()),
    };
    if !roles_to_add.is_empty() {
        let mut qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO games_roles (game_id, role_id) ");
        qb.push_values(roles_to_add.iter(), |mut b, role_id| {
            b.push_bind(game_id);
            b.push_bind(role_id);
        });
        qb.push(" ON CONFLICT DO NOTHING RETURNING game_id, role_id");
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
        // Scoped to the game (see tags note above).
        let rows = sqlx::query(
            "DELETE FROM games_roles WHERE game_id = $1 AND role_id = ANY($2) \
             RETURNING game_id, role_id",
        )
        .bind(game_id)
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
    // Single atomic statement: the previous check-then-delete could 500 when a
    // concurrent delete won the race between the two statements.
    let row = sqlx::query(&format!(
        "DELETE FROM games WHERE game_id = $1 AND server_id = $2 \
         RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(game_id)
    .bind(server_id)
    .fetch_optional(db)
    .await?
    .ok_or_else(|| HttpError::not_found("Game not found."))?;
    map_game_row_with_thumbnail(&row).map_err(HttpError::from)
}

pub async fn map_category_to_game(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
    category_id: i32,
) -> Result<Vec<GameWithoutRelations>> {
    let mut tx = db.begin().await?;
    ensure_category_belongs_to_server(&mut *tx, server_id, category_id).await?;
    let rows = sqlx::query(&format!(
        "UPDATE games SET category_id = $3 WHERE game_id = $1 AND server_id = $2 \
         RETURNING {GAME_COLUMNS_WITH_THUMBNAIL}"
    ))
    .bind(game_id)
    .bind(server_id)
    .bind(category_id)
    .fetch_all(&mut *tx)
    .await?;
    if rows.is_empty() {
        return Err(HttpError::not_found("Game not found."));
    }
    tx.commit().await?;
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

pub async fn find_games_by_channel_ids(
    db: &PgPool,
    server_id: &str,
    channel_ids: &[String],
) -> Result<Vec<Game>> {
    if channel_ids.is_empty() {
        return Ok(Vec::new());
    }
    let rows = sqlx::query(&format!(
        "SELECT {GAME_COLUMNS_NO_THUMBNAIL} FROM games \
         WHERE server_id = $1 AND channels && $2"
    ))
    .bind(server_id)
    .bind(channel_ids)
    .fetch_all(db)
    .await?;
    let games = rows
        .iter()
        .map(map_game_row_no_thumbnail)
        .collect::<sqlx::Result<Vec<_>>>()
        .map_err(HttpError::from)?;
    attach_game_relations(db, games).await
}

pub async fn find_games_by_role_ids(
    db: &PgPool,
    server_id: &str,
    role_ids: &[String],
) -> Result<Vec<Game>> {
    if role_ids.is_empty() {
        return Ok(Vec::new());
    }
    let rows = sqlx::query(&format!(
        "SELECT DISTINCT {GAME_COLUMNS_NO_THUMBNAIL} FROM games \
         WHERE server_id = $1 AND game_id IN ( \
             SELECT game_id FROM games_roles WHERE role_id = ANY($2) \
         )"
    ))
    .bind(server_id)
    .bind(role_ids)
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

/// Roles and role categories of a server (categories ordered by ID, matching
/// the old backend's getServerRoleMetadata).
pub async fn get_server_role_metadata(
    db: &PgPool,
    server_id: &str,
) -> Result<(Vec<Role>, Vec<RoleCategory>)> {
    let roles_fut = async {
        sqlx::query_as::<_, Role>(
            "SELECT role_id, server_id, role_category_id, self_assignable, description \
             FROM roles WHERE server_id = $1",
        )
        .bind(server_id)
        .fetch_all(db)
        .await
        .map_err(HttpError::from)
    };
    let categories_fut = async {
        sqlx::query_as::<_, RoleCategory>(
            "SELECT role_category_id, server_id, name, is_verification \
             FROM roles_categories WHERE server_id = $1 ORDER BY role_category_id ASC",
        )
        .bind(server_id)
        .fetch_all(db)
        .await
        .map_err(HttpError::from)
    };
    tokio::try_join!(roles_fut, categories_fut)
}

/// Raw pieces of GET /games/{gameId}: the game row (without thumbnail), its
/// category, and the associated role IDs.
pub struct GameDetails {
    pub game_id: i32,
    pub server_id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<Category>,
    pub channels: Vec<String>,
    pub role_ids: Vec<String>,
}

pub async fn get_game_details_in_db(
    db: &PgPool,
    game_id: i32,
    server_id: &str,
) -> Result<Option<GameDetails>> {
    let row = sqlx::query(
        "SELECT g.game_id, g.server_id, g.name, g.description, g.channels, \
                c.category_id, c.server_id AS category_server_id, c.name AS category_name \
         FROM games g \
         LEFT JOIN categories c ON c.category_id = g.category_id \
         WHERE g.game_id = $1 AND g.server_id = $2",
    )
    .bind(game_id)
    .bind(server_id)
    .fetch_optional(db)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let role_ids: Vec<String> =
        sqlx::query_scalar("SELECT role_id FROM games_roles WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(db)
            .await?;
    let category = match row.try_get::<Option<i32>, _>("category_id").map_err(HttpError::from)? {
        Some(category_id) => Some(Category {
            category_id,
            server_id: row.try_get("category_server_id").map_err(HttpError::from)?,
            name: row.try_get("category_name").map_err(HttpError::from)?,
        }),
        None => None,
    };
    Ok(Some(GameDetails {
        game_id: row.try_get("game_id").map_err(HttpError::from)?,
        server_id: row.try_get("server_id").map_err(HttpError::from)?,
        name: row.try_get("name").map_err(HttpError::from)?,
        description: row.try_get("description").map_err(HttpError::from)?,
        category,
        channels: row
            .try_get::<Option<Vec<String>>, _>("channels")
            .map_err(HttpError::from)?
            .unwrap_or_default(),
        role_ids,
    }))
}

/// PATCH /roles/{roleId}: update only the provided settings. The category
/// check and the update share one transaction.
pub async fn update_role_settings(
    db: &PgPool,
    role_id: &str,
    server_id: &str,
    role_category_id: Option<Option<i32>>,
    self_assignable: Option<bool>,
    description: Option<Option<String>>,
) -> Result<Role> {
    let mut tx = db.begin().await?;
    if let Some(Some(category_id)) = role_category_id {
        let exists: Option<i32> = sqlx::query_scalar(
            "SELECT role_category_id FROM roles_categories \
             WHERE role_category_id = $1 AND server_id = $2",
        )
        .bind(category_id)
        .bind(server_id)
        .fetch_optional(&mut *tx)
        .await?;
        if exists.is_none() {
            return Err(HttpError::bad_request(
                "Role category does not belong to this server.",
            ));
        }
    }
    let mut qb: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE roles SET ");
    let mut fields = qb.separated(", ");
    if let Some(role_category_id) = role_category_id {
        fields.push("role_category_id = ");
        fields.push_bind_unseparated(role_category_id);
    }
    if let Some(self_assignable) = self_assignable {
        fields.push("self_assignable = ");
        fields.push_bind_unseparated(self_assignable);
    }
    if let Some(description) = description {
        fields.push("description = ");
        fields.push_bind_unseparated(description);
    }
    qb.push(" WHERE role_id = ");
    qb.push_bind(role_id);
    qb.push(" AND server_id = ");
    qb.push_bind(server_id);
    qb.push(" RETURNING role_id, server_id, role_category_id, self_assignable, description");
    let role: Option<Role> = qb.build_query_as().fetch_optional(&mut *tx).await?;
    let Some(role) = role else {
        return Err(HttpError::not_found("Role not found in this server."));
    };
    tx.commit().await?;
    Ok(role)
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


/// Batched INSERT of gateway roles missing from the DB (role sync). Conflicts
/// are skipped (the TS per-row insert swallowed unique violations the same way).
pub async fn create_roles_bulk<'e>(
    executor: impl PgExecutor<'e>,
    server_id: &str,
    role_ids: &[String],
) -> Result<()> {
    if role_ids.is_empty() {
        return Ok(());
    }
    let mut qb: QueryBuilder<Postgres> = QueryBuilder::new("INSERT INTO roles (server_id, role_id) ");
    qb.push_values(role_ids.iter(), |mut b, role_id| {
        b.push_bind(server_id);
        b.push_bind(role_id);
    });
    qb.push(" ON CONFLICT DO NOTHING");
    qb.build().execute(executor).await?;
    Ok(())
}

/// Batched delete of DB roles that no longer exist in Discord (role sync).
/// games_roles rows cascade.
pub async fn delete_roles_bulk<'e>(
    executor: impl PgExecutor<'e>,
    server_id: &str,
    role_ids: &[String],
) -> Result<()> {
    if role_ids.is_empty() {
        return Ok(());
    }
    sqlx::query("DELETE FROM roles WHERE server_id = $1 AND role_id = ANY($2)")
        .bind(server_id)
        .bind(role_ids)
        .execute(executor)
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
    is_verification: bool,
) -> Result<Vec<RoleCategory>> {
    let created: Vec<RoleCategory> = sqlx::query_as(
        "INSERT INTO roles_categories (server_id, name, is_verification) VALUES ($1, $2, $3) \
         RETURNING role_category_id, server_id, name, is_verification",
    )
    .bind(server_id)
    .bind(name)
    .bind(is_verification)
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
        "DELETE FROM roles_categories \
         WHERE role_category_id = $1 AND server_id = $2 AND NOT is_verification \
         RETURNING role_category_id, server_id, name, is_verification",
    )
    .bind(role_category_id)
    .bind(server_id)
    .fetch_all(db)
    .await?;
    if deleted.is_empty() {
        let is_verification: Option<bool> = sqlx::query_scalar(
            "SELECT is_verification FROM roles_categories \
             WHERE role_category_id = $1 AND server_id = $2",
        )
        .bind(role_category_id)
        .bind(server_id)
        .fetch_optional(db)
        .await?;
        if is_verification == Some(true) {
            return Err(HttpError::bad_request(
                "Cannot delete verification role category.",
            ));
        }
    }
    Ok(deleted)
}

/// Role IDs a member must ALL hold when verification is on.
pub async fn get_verification_requirement(
    db: &PgPool,
    server_id: &str,
) -> Result<(bool, Vec<String>)> {
    let verification_required: Option<bool> =
        sqlx::query_scalar("SELECT verification_required FROM servers WHERE server_id = $1")
            .bind(server_id)
            .fetch_optional(db)
            .await?;
    if verification_required != Some(true) {
        return Ok((false, Vec::new()));
    }
    let required_role_ids: Vec<String> = sqlx::query_scalar(
        "SELECT r.role_id FROM roles r \
         JOIN roles_categories rc ON rc.role_category_id = r.role_category_id \
         WHERE r.server_id = $1 AND rc.server_id = $1 AND rc.is_verification",
    )
    .bind(server_id)
    .fetch_all(db)
    .await?;
    Ok((true, required_role_ids))
}

pub async fn update_role_category_of_role(
    db: &PgPool,
    role_id: &str,
    role_category_id: Option<i32>,
    server_id: &str,
) -> Result<Vec<Role>> {
    let mut tx = db.begin().await?;
    if let Some(role_category_id) = role_category_id {
        let exists: Option<i32> = sqlx::query_scalar(
            "SELECT role_category_id FROM roles_categories \
             WHERE role_category_id = $1 AND server_id = $2",
        )
        .bind(role_category_id)
        .bind(server_id)
        .fetch_optional(&mut *tx)
        .await?;
        if exists.is_none() {
            return Err(HttpError::bad_request(
                "Role category does not belong to this server.",
            ));
        }
    }
    // A single parameterized statement covers both assign (Some) and unassign
    // (None -> NULL), matching the TS branches.
    let rows: Vec<Role> = sqlx::query_as(
        "UPDATE roles SET role_category_id = $3 WHERE role_id = $1 AND server_id = $2 \
         RETURNING role_id, server_id, role_category_id, self_assignable, description",
    )
    .bind(role_id)
    .bind(server_id)
    .bind(role_category_id)
    .fetch_all(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(rows)
}

#[cfg(test)]
mod smoke_tests {
    //! End-to-end SQL smoke test against a real Postgres. Skipped unless
    //! SMOKE_DATABASE_URL is set (e.g. postgres://juicer:juicer@127.0.0.1:15432/juicer).
    use super::*;

    #[tokio::test]
    async fn full_db_flow() {
        let Ok(url) = std::env::var("SMOKE_DATABASE_URL") else {
            eprintln!("SMOKE_DATABASE_URL not set — skipping DB smoke test");
            return;
        };
        let db = PgPool::connect(&url).await.expect("connect");
        ensure_verification_category_schema(&db).await.expect("schema guard");
        let sid = "smoke-server";
        // Clean slate for reruns (roles_categories has no ON DELETE CASCADE, so
        // it must go before servers).
        sqlx::query("DELETE FROM roles_categories WHERE server_id = $1")
            .bind(sid)
            .execute(&db)
            .await
            .unwrap();
        sqlx::query("DELETE FROM servers WHERE server_id = $1")
            .bind(sid)
            .execute(&db)
            .await
            .unwrap();

        // servers: create (with verification category, atomically) + duplicate -> 400
        let server = create_server_with_verification_category(&db, sid)
            .await
            .expect("create_server");
        assert_eq!(server.server_id, sid);
        assert!(!server.verification_required);
        let dup = create_server_with_verification_category(&db, sid).await.unwrap_err();
        assert_eq!(dup.status.as_u16(), 400);
        assert_eq!(dup.message, "Server already exists.");

        update_server_verification_required(&db, sid, true).await.unwrap();

        // categories / tags / role categories / roles
        let cat = create_category(&db, sid, "rpg").await.unwrap()[0].clone();
        let tag = create_tag(&db, sid, "coop").await.unwrap()[0].clone();
        let tag_again = create_tag(&db, sid, "coop").await.unwrap();
        assert_eq!(tag_again[0].tag_id, tag.tag_id, "create_tag must return existing tag");
        // Server creation auto-created the flagged verification category.
        let rc = sqlx::query_as::<_, RoleCategory>(
            "SELECT role_category_id, server_id, name, is_verification \
             FROM roles_categories WHERE server_id = $1",
        )
        .bind(sid)
        .fetch_one(&db)
        .await
        .unwrap();
        assert_eq!(rc.name, "verification");
        assert!(rc.is_verification);
        // The verification category is protected by its flag, not by ID 1.
        let protected = delete_role_category(&db, rc.role_category_id, sid).await.unwrap_err();
        assert_eq!(protected.status.as_u16(), 400);
        create_roles_bulk(&db, sid, &["111".into()]).await.unwrap();
        create_roles_bulk(&db, sid, &["111".into()]).await.unwrap(); // conflict skipped
        let roles = get_all_roles_in_server_in_db(&db, sid).await.unwrap();
        assert_eq!(roles.len(), 1);

        // role info: set description, clear via explicit null, keep via absent
        update_role_info(&db, "111", sid, Some(true), Some(Some("desc".into()))).await.unwrap();
        let r = &get_roles_in_server_in_db_by_role_ids(&db, sid, &["111".into()]).await.unwrap()[0];
        assert_eq!(r.description.as_deref(), Some("desc"));
        assert!(r.self_assignable);
        update_role_info(&db, "111", sid, Some(true), None).await.unwrap();
        let r = &get_roles_in_server_in_db_by_role_ids(&db, sid, &["111".into()]).await.unwrap()[0];
        assert_eq!(r.description.as_deref(), Some("desc"), "absent description must be kept");
        update_role_info(&db, "111", sid, Some(true), Some(None)).await.unwrap();
        let r = &get_roles_in_server_in_db_by_role_ids(&db, sid, &["111".into()]).await.unwrap()[0];
        assert_eq!(r.description, None, "explicit null must clear description");

        update_role_category_of_role(&db, "111", Some(rc.role_category_id), sid).await.unwrap();
        // Verification requirement reads roles in the verification category.
        let (required, ids) = get_verification_requirement(&db, sid).await.unwrap();
        assert!(required);
        assert_eq!(ids, vec!["111".to_string()]);
        // Cross-server category IDs are rejected (issue #48-adjacent).
        let foreign = update_role_category_of_role(&db, "111", Some(999_999), sid)
            .await
            .unwrap_err();
        assert_eq!(foreign.status.as_u16(), 400);
        update_role_category_of_role(&db, "111", None, sid).await.unwrap();
        let (required, ids) = get_verification_requirement(&db, sid).await.unwrap();
        assert!(required);
        assert!(ids.is_empty());

        // games: create, update with tags/roles diff, search, thumbnail, delete
        let game = create_game(&db, sid, "Factorio", Some("automation"), Some(cat.category_id))
            .await
            .unwrap();
        let upd = update_game(
            &db,
            game.game_id,
            sid,
            UpdateGameParams {
                name: Some("Factorio SA".into()),
                description: None,
                category_id: None,
                thumbnail: None,
                channels: Some(vec!["123".into()]),
                tag_ids: Some(vec![tag.tag_id]),
                role_ids: Some(vec!["111".into()]),
            },
        )
        .await
        .unwrap();
        assert_eq!(upd.updated_game.as_ref().unwrap().name, "Factorio SA");
        assert_eq!(upd.tags.added.as_ref().unwrap().len(), 1);
        assert_eq!(upd.roles.added.as_ref().unwrap().len(), 1);
        // removing the tag via empty list
        let upd2 = update_game(
            &db,
            game.game_id,
            sid,
            UpdateGameParams {
                name: None,
                description: None,
                category_id: None,
                thumbnail: None,
                channels: None,
                tag_ids: Some(vec![]),
                role_ids: Some(vec!["111".into()]),
            },
        )
        .await
        .unwrap();
        assert_eq!(upd2.tags.removed.as_ref().unwrap().len(), 1);
        assert!(upd2.roles.added.is_none() && upd2.roles.removed.is_none());
        // put the tag back for search
        update_game(
            &db,
            game.game_id,
            sid,
            UpdateGameParams {
                name: None, description: None, category_id: None, thumbnail: None,
                channels: None, tag_ids: Some(vec![tag.tag_id]), role_ids: None,
            },
        )
        .await
        .unwrap();
        // absent tag_ids/role_ids must leave relations untouched (the TS
        // backend wiped them — fixed divergence)
        let noop = update_game(
            &db,
            game.game_id,
            sid,
            UpdateGameParams {
                name: Some("Factorio SA".into()), description: None, category_id: None,
                thumbnail: None, channels: None, tag_ids: None, role_ids: None,
            },
        )
        .await
        .unwrap();
        assert!(noop.tags.removed.is_none() && noop.roles.removed.is_none());
        let kept: i64 =
            sqlx::query_scalar("SELECT count(*) FROM games_tags WHERE game_id = $1")
                .bind(game.game_id)
                .fetch_one(&db)
                .await
                .unwrap();
        assert_eq!(kept, 1, "absent tag_ids must not remove existing tags");

        let missing = update_game(
            &db, 999_999, sid,
            UpdateGameParams { name: None, description: None, category_id: None,
                thumbnail: None, channels: None, tag_ids: None, role_ids: None },
        )
        .await
        .unwrap_err();
        assert_eq!(missing.status.as_u16(), 404);

        // unknown/foreign tags, roles and categories are rejected
        let bad_tag = update_game(
            &db, game.game_id, sid,
            UpdateGameParams { name: None, description: None, category_id: None,
                thumbnail: None, channels: None, tag_ids: Some(vec![999_999]), role_ids: None },
        )
        .await
        .unwrap_err();
        assert_eq!(bad_tag.status.as_u16(), 400);
        let bad_role = update_game(
            &db, game.game_id, sid,
            UpdateGameParams { name: None, description: None, category_id: None,
                thumbnail: None, channels: None, tag_ids: None,
                role_ids: Some(vec!["424242".into()]) },
        )
        .await
        .unwrap_err();
        assert_eq!(bad_role.status.as_u16(), 400);
        let bad_category = create_game(&db, sid, "Foreign", None, Some(999_999)).await.unwrap_err();
        assert_eq!(bad_category.status.as_u16(), 400);

        assert_eq!(find_games_by_name(&db, sid, "factorio").await.unwrap().len(), 1);
        assert_eq!(find_games_by_tags(&db, sid, &["coop".into()]).await.unwrap().len(), 1);
        assert_eq!(find_games_by_category_name(&db, sid, "rpg").await.unwrap().len(), 1);
        let all = get_all_games_in_server(&db, sid).await.unwrap();
        assert_eq!(all.len(), 1);
        assert!(all[0].games_tags.as_ref().unwrap().len() == 1);
        assert!(all[0].game.thumbnail.is_none(), "list payloads must omit thumbnail");

        update_game_thumbnail(&db, game.game_id, sid, &[7u8; 200]).await.unwrap();
        let thumb = get_game_thumbnail(&db, game.game_id, sid).await.unwrap().unwrap();
        assert_eq!(thumb.len(), 200);

        // full aggregate
        let data = get_server_data_in_db(&db, sid).await.unwrap().unwrap();
        assert!(data.verification_required);
        assert_eq!(data.games.as_ref().unwrap().len(), 1);
        assert_eq!(data.categories.as_ref().unwrap().len(), 1);
        assert_eq!(data.tags.as_ref().unwrap().len(), 1);
        assert_eq!(data.roles.as_ref().unwrap().len(), 1);
        assert_eq!(data.role_categories.as_ref().unwrap().len(), 1);
        assert!(get_server_data_in_db(&db, "no-such").await.unwrap().is_none());

        // relation removal is scoped to the game: game2 shares the tag, and
        // removing it from game1 must not strip it from game2 (the TS delete
        // filtered only on tag_id and corrupted sibling games).
        let game2 = create_game(&db, sid, "Satisfactory", None, None).await.unwrap();
        let only_tag = |ids: Vec<i32>| UpdateGameParams {
            name: None, description: None, category_id: None, thumbnail: None,
            channels: None, tag_ids: Some(ids), role_ids: None,
        };
        update_game(&db, game2.game_id, sid, only_tag(vec![tag.tag_id])).await.unwrap();
        let removed = update_game(&db, game.game_id, sid, only_tag(vec![])).await.unwrap();
        assert_eq!(removed.tags.removed.as_ref().unwrap().len(), 1);
        let game2_tags: Vec<i32> =
            sqlx::query_scalar("SELECT tag_id FROM games_tags WHERE game_id = $1")
                .bind(game2.game_id)
                .fetch_all(&db)
                .await
                .unwrap();
        assert_eq!(game2_tags, vec![tag.tag_id], "sibling game must keep its tag");
        update_game(&db, game.game_id, sid, only_tag(vec![tag.tag_id])).await.unwrap();
        delete_game(&db, game2.game_id, sid).await.unwrap();

        // deletes
        let deleted = delete_game(&db, game.game_id, sid).await.unwrap();
        assert_eq!(deleted.game_id, game.game_id);
        assert_eq!(delete_tag(&db, tag.tag_id, sid).await.unwrap().len(), 1);
        assert_eq!(delete_category(&db, cat.category_id, sid).await.unwrap().len(), 1);
        delete_roles_bulk(&db, sid, &["111".into()]).await.unwrap();
        // Ordinary role categories can still be created and deleted.
        let misc = create_role_category(&db, sid, "misc", false).await.unwrap()[0].clone();
        assert!(!misc.is_verification);
        assert_eq!(delete_role_category(&db, misc.role_category_id, sid).await.unwrap().len(), 1);
        // The verification category stays undeletable through the API; remove
        // it directly for cleanup.
        let still_protected = delete_role_category(&db, rc.role_category_id, sid).await.unwrap_err();
        assert_eq!(still_protected.status.as_u16(), 400);
        sqlx::query("DELETE FROM roles_categories WHERE server_id = $1")
            .bind(sid)
            .execute(&db)
            .await
            .unwrap();
        assert!(get_all_roles_in_server_in_db(&db, sid).await.unwrap().is_empty());
    }
}
