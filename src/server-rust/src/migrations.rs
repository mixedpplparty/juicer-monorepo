//! Versioned PostgreSQL schema changes. Only the explicit CLI mode writes DDL.
use sqlx::{migrate::Migrator, PgPool};

pub static MIGRATOR: Migrator = sqlx::migrate!();

pub async fn run(pool: &PgPool, adopt_legacy: bool) -> Result<(), Box<dyn std::error::Error>> {
    // Close the dedicated connection on every exit, including an interrupted or
    // failed migration: never return a session advisory lock to a pool.
    let mut connection = pool.acquire().await?.detach();
    sqlx::query("SELECT set_config('juicer.allow_legacy', $1, false)")
        .bind(if adopt_legacy { "on" } else { "off" })
        .execute(&mut connection)
        .await?;
    sqlx::raw_sql("SET lock_timeout = '30s'; SET statement_timeout = '5min'; SET search_path = public, pg_catalog")
        .execute(&mut connection)
        .await?;
    MIGRATOR.run(&mut connection).await?;
    Ok(())
}

/// Read-only check: do not start serving against missing, changed or newer SQL.
pub async fn check(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let applied: Vec<(i64, bool, Vec<u8>)> = sqlx::query_as(
        "SELECT version, success, checksum FROM public._sqlx_migrations ORDER BY version",
    )
    .fetch_all(pool)
    .await?;
    let expected: Vec<_> = MIGRATOR.iter().collect();
    if applied.len() != expected.len()
        || applied
            .iter()
            .zip(expected)
            .any(|((version, success, checksum), migration)| {
                !success
                    || *version != migration.version
                    || checksum.as_slice() != migration.checksum.as_ref()
            })
    {
        return Err(
            "Database migrations do not match this release; run the release's migrate command"
                .into(),
        );
    }
    // Exercise every application table without reading application records.
    sqlx::query("SELECT (SELECT count(*) FROM public.servers WHERE false), (SELECT count(*) FROM public.categories WHERE false), (SELECT count(*) FROM public.tags WHERE false), (SELECT count(*) FROM public.games WHERE false), (SELECT count(*) FROM public.roles WHERE false), (SELECT count(is_verification) FROM public.roles_categories WHERE false), (SELECT count(*) FROM public.games_roles WHERE false), (SELECT count(*) FROM public.games_tags WHERE false)")
        .execute(pool).await?;
    Ok(())
}

#[cfg(test)]
mod tests;
