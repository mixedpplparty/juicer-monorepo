use super::*;
use std::collections::BTreeMap;

const LEGACY: &str = include_str!("../../tests/fixtures/legacy.sql");
const DATA: &str = include_str!("../../tests/fixtures/data.sql");
const TABLES: [&str; 8] = [
    "servers",
    "categories",
    "tags",
    "roles_categories",
    "roles",
    "games",
    "games_roles",
    "games_tags",
];

async fn legacy(pool: &PgPool) {
    sqlx::raw_sql(&format!("{LEGACY}\nSET search_path=public,pg_catalog;"))
        .execute(pool)
        .await
        .unwrap();
    sqlx::raw_sql("CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint); INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES ('original-history',1234)")
        .execute(pool).await.unwrap();
    sqlx::raw_sql(DATA).execute(pool).await.unwrap();
}

async fn data(pool: &PgPool) -> BTreeMap<String, Vec<String>> {
    let mut result = BTreeMap::new();
    for table in TABLES {
        // The only allowed row change is the separately asserted verification backfill.
        let rows = sqlx::query_scalar(&format!("SELECT (to_jsonb(t) - 'is_verification')::text FROM public.{table} t ORDER BY (to_jsonb(t) - 'is_verification')::text"))
            .fetch_all(pool).await.unwrap();
        result.insert(table.into(), rows);
    }
    for sequence in [
        "categories_category_id_seq",
        "tags_tag_id_seq",
        "roles_categories_role_category_id_seq",
        "games_game_id_seq",
    ] {
        let rows = sqlx::query_scalar(&format!(
            "SELECT jsonb_build_array(last_value,is_called)::text FROM public.{sequence}"
        ))
        .fetch_all(pool)
        .await
        .unwrap();
        result.insert(sequence.into(), rows);
    }
    result
}

async fn history_count(pool: &PgPool) -> i64 {
    sqlx::query_scalar("SELECT count(*) FROM public._sqlx_migrations")
        .fetch_one(pool)
        .await
        .unwrap()
}

#[sqlx::test(migrations = false)]
async fn fresh_database_and_repeat(pool: PgPool) {
    assert!(check(&pool).await.is_err());
    run(&pool, false).await.unwrap();
    check(&pool).await.unwrap();
    assert_eq!(history_count(&pool).await, 3);
    sqlx::raw_sql(DATA).execute(&pool).await.unwrap();
    let before = data(&pool).await;
    run(&pool, false).await.unwrap();
    assert_eq!(data(&pool).await, before);
    assert_eq!(history_count(&pool).await, 3);
    let indexes: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%_idx'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(indexes, 8);
}

#[sqlx::test(migrations = false)]
async fn legacy_preserves_all_data_sequences_and_history(pool: PgPool) {
    legacy(&pool).await;
    let before = data(&pool).await;
    assert!(
        run(&pool, false).await.is_err(),
        "adoption must be explicit"
    );
    assert_eq!(history_count(&pool).await, 0);
    assert_eq!(data(&pool).await, before);
    run(&pool, true).await.unwrap();
    check(&pool).await.unwrap();
    assert_eq!(data(&pool).await, before);
    let flags: Vec<(i32, bool)> = sqlx::query_as(
        "SELECT role_category_id,is_verification FROM roles_categories ORDER BY role_category_id",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(flags, vec![(1, true), (2, false), (3, true), (4, false)]);
    let old: (String, i64) =
        sqlx::query_as("SELECT hash,created_at FROM drizzle.__drizzle_migrations")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(old, ("original-history".into(), 1234));
    run(&pool, false).await.unwrap();
    assert_eq!(data(&pool).await, before);
    let new_id: i32 = sqlx::query_scalar(
        "INSERT INTO games(server_id,name) VALUES ('one','next') RETURNING game_id",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(new_id, 3);
}

#[sqlx::test(migrations = false)]
async fn older_schema_without_flag(pool: PgPool) {
    legacy(&pool).await;
    sqlx::raw_sql("ALTER TABLE roles_categories DROP COLUMN is_verification")
        .execute(&pool)
        .await
        .unwrap();
    let before = data(&pool).await;
    run(&pool, true).await.unwrap();
    assert_eq!(data(&pool).await, before);
    let ids: Vec<i32> = sqlx::query_scalar(
        "SELECT role_category_id FROM roles_categories WHERE is_verification ORDER BY 1",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(ids, vec![2, 3]);
}

#[sqlx::test(migrations = false)]
async fn already_current_legacy_schema(pool: PgPool) {
    legacy(&pool).await;
    sqlx::raw_sql(include_str!("../../migrations/0003_query_indexes.sql"))
        .execute(&pool)
        .await
        .unwrap();
    run(&pool, true).await.unwrap();
    check(&pool).await.unwrap();
}

#[sqlx::test(migrations = false)]
async fn rejects_changed_column_without_mutating_data(pool: PgPool) {
    legacy(&pool).await;
    sqlx::raw_sql("ALTER TABLE games ALTER COLUMN name TYPE varchar(300)")
        .execute(&pool)
        .await
        .unwrap();
    let before = data(&pool).await;
    assert!(run(&pool, true).await.is_err());
    assert_eq!(data(&pool).await, before);
    assert_eq!(history_count(&pool).await, 0);
    let reference: Option<String> =
        sqlx::query_scalar("SELECT to_regnamespace('_juicer_migration_reference')::text")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(reference.is_none());
}

#[sqlx::test(migrations = false)]
async fn rejects_changed_constraint(pool: PgPool) {
    legacy(&pool).await;
    sqlx::raw_sql("ALTER TABLE games DROP CONSTRAINT thumbnail_size")
        .execute(&pool)
        .await
        .unwrap();
    assert!(run(&pool, true).await.is_err());
    assert_eq!(history_count(&pool).await, 0);
}

#[sqlx::test(migrations = false)]
async fn rejects_wrong_index(pool: PgPool) {
    legacy(&pool).await;
    sqlx::raw_sql("CREATE INDEX games_server_id_idx ON games(name)")
        .execute(&pool)
        .await
        .unwrap();
    let before = data(&pool).await;
    assert!(run(&pool, true).await.is_err());
    assert_eq!(data(&pool).await, before);
    assert_eq!(history_count(&pool).await, 0);
}

#[sqlx::test(migrations = false)]
async fn rejects_partial_schema(pool: PgPool) {
    sqlx::raw_sql(
        "CREATE TABLE servers(server_id text PRIMARY KEY); INSERT INTO servers VALUES ('keep')",
    )
    .execute(&pool)
    .await
    .unwrap();
    assert!(run(&pool, true).await.is_err());
    let retained: String = sqlx::query_scalar("SELECT server_id FROM servers")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(retained, "keep");
    assert_eq!(history_count(&pool).await, 0);
}

#[sqlx::test(migrations = false)]
async fn concurrent_migrators(pool: PgPool) {
    let (a, b) = tokio::join!(run(&pool, false), run(&pool, false));
    a.unwrap();
    b.unwrap();
    assert_eq!(history_count(&pool).await, 3);
    check(&pool).await.unwrap();
}

#[sqlx::test]
async fn refuses_changed_or_newer_history(pool: PgPool) {
    sqlx::raw_sql("UPDATE _sqlx_migrations SET checksum=decode('00','hex') WHERE version=1")
        .execute(&pool)
        .await
        .unwrap();
    assert!(check(&pool).await.is_err());
    assert!(run(&pool, false).await.is_err());
}

#[sqlx::test(migrations = false)]
async fn failed_migration_is_transactional(pool: PgPool) {
    let migration = sqlx::migrate::Migration::new(
        1,
        "failure".into(),
        sqlx::migrate::MigrationType::Simple,
        "CREATE TABLE must_rollback(id int); SELECT 1/0;".into(),
        false,
    );
    let migrator = Migrator {
        migrations: std::borrow::Cow::Owned(vec![migration]),
        ..Migrator::DEFAULT
    };
    let mut conn = pool.acquire().await.unwrap().detach();
    assert!(migrator.run(&mut conn).await.is_err());
    drop(conn);
    let exists: Option<String> =
        sqlx::query_scalar("SELECT to_regclass('public.must_rollback')::text")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(exists.is_none());
    assert_eq!(history_count(&pool).await, 0);
    run(&pool, false).await.unwrap();
}

#[sqlx::test(migrations = false)]
async fn interrupted_migration_can_retry(pool: PgPool) {
    let migration = sqlx::migrate::Migration::new(
        1,
        "interruption".into(),
        sqlx::migrate::MigrationType::Simple,
        "CREATE TABLE must_rollback(id int); SELECT pg_sleep(30);".into(),
        false,
    );
    let migrator = Migrator {
        migrations: std::borrow::Cow::Owned(vec![migration]),
        ..Migrator::DEFAULT
    };
    let mut conn = pool.acquire().await.unwrap().detach();
    let pid: i32 = sqlx::query_scalar("SELECT pg_backend_pid()")
        .fetch_one(&mut conn)
        .await
        .unwrap();
    let interrupt = async {
        // Wait until this exact test connection is sleeping inside its transaction.
        for _ in 0..100 {
            let waiting: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$1 AND wait_event='PgSleep')")
                .bind(pid).fetch_one(&pool).await.unwrap();
            if waiting {
                break;
            }
            tokio::time::sleep(std::time::Duration::from_millis(20)).await;
        }
        sqlx::query("SELECT pg_terminate_backend($1)")
            .bind(pid)
            .execute(&pool)
            .await
            .unwrap();
    };
    let (result, ()) = tokio::join!(migrator.run(&mut conn), interrupt);
    assert!(result.is_err());
    drop(conn);
    run(&pool, false).await.unwrap();
    let exists: Option<String> =
        sqlx::query_scalar("SELECT to_regclass('public.must_rollback')::text")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(exists.is_none());
    check(&pool).await.unwrap();
}
