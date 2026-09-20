-- Immutable baseline, transcribed from the retired Drizzle definitions.
-- SQLx runs this entire file in one transaction. Existing data is never copied,
-- recreated, or deleted. The temporary reference schema validates legacy DDL.
SET LOCAL search_path = public, pg_catalog;

DO $migration$
DECLARE
    ddl text := $ddl$
CREATE TABLE @schema@.servers (
    server_id text PRIMARY KEY NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    verification_required boolean NOT NULL DEFAULT false
);
CREATE TABLE @schema@.categories (
    category_id serial PRIMARY KEY,
    server_id text NOT NULL REFERENCES @schema@.servers(server_id) ON DELETE CASCADE,
    name varchar(100) NOT NULL
);
CREATE TABLE @schema@.tags (
    tag_id serial PRIMARY KEY,
    server_id text NOT NULL REFERENCES @schema@.servers(server_id) ON DELETE CASCADE,
    name varchar(50) NOT NULL
);
CREATE TABLE @schema@.roles_categories (
    role_category_id serial PRIMARY KEY,
    server_id text NOT NULL REFERENCES @schema@.servers(server_id),
    name varchar(100) NOT NULL
);
CREATE TABLE @schema@.roles (
    role_id text PRIMARY KEY NOT NULL,
    server_id text NOT NULL REFERENCES @schema@.servers(server_id) ON DELETE CASCADE,
    role_category_id integer REFERENCES @schema@.roles_categories(role_category_id) ON DELETE SET NULL,
    self_assignable boolean NOT NULL DEFAULT false,
    description text
);
CREATE TABLE @schema@.games (
    game_id serial PRIMARY KEY,
    server_id text NOT NULL REFERENCES @schema@.servers(server_id) ON DELETE CASCADE,
    category_id integer REFERENCES @schema@.categories(category_id) ON DELETE SET NULL,
    name varchar(255) NOT NULL,
    description text,
    thumbnail bytea,
    channels text[],
    CONSTRAINT thumbnail_size CHECK (octet_length(thumbnail) <= 1048576)
);
CREATE TABLE @schema@.games_roles (
    game_id integer NOT NULL REFERENCES @schema@.games(game_id) ON DELETE CASCADE,
    role_id text NOT NULL REFERENCES @schema@.roles(role_id) ON DELETE CASCADE,
    CONSTRAINT games_roles_game_id_role_id_pk PRIMARY KEY (game_id, role_id)
);
CREATE TABLE @schema@.games_tags (
    game_id integer NOT NULL REFERENCES @schema@.games(game_id) ON DELETE CASCADE,
    tag_id integer NOT NULL REFERENCES @schema@.tags(tag_id) ON DELETE CASCADE,
    CONSTRAINT games_tags_game_id_tag_id_pk PRIMARY KEY (game_id, tag_id)
);
$ddl$;
    app_tables text[] := ARRAY['servers','categories','tags','roles_categories','roles','games','games_roles','games_tags'];
    existing_count integer;
    table_name text;
    namespace text;
    expected jsonb;
    actual jsonb;
    signatures jsonb[];
    index_row record;
BEGIN
    SELECT count(*) INTO existing_count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=ANY(app_tables);
    IF existing_count=0 THEN
        IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S') AND c.relname <> '_sqlx_migrations') THEN
            RAISE EXCEPTION 'Refusing to initialize a nonempty, unrecognized public schema';
        END IF;
        EXECUTE replace(ddl, '@schema@', 'public');
    ELSIF existing_count <> 8 THEN
        RAISE EXCEPTION 'Incomplete legacy schema: expected all 8 application tables, found %', existing_count;
    ELSIF current_setting('juicer.allow_legacy', true) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'Legacy schema detected. Back up and restore-test the database, then run migrate --adopt-legacy';
    END IF;

    -- Prevent concurrent DDL/writes while validating the adoption baseline.
    LOCK TABLE public.servers, public.categories, public.tags, public.roles_categories,
        public.roles, public.games, public.games_roles, public.games_tags IN SHARE ROW EXCLUSIVE MODE;

    -- CREATE deliberately fails if someone already owns this reserved name.
    CREATE SCHEMA _juicer_migration_reference;
    EXECUTE replace(ddl, '@schema@', '_juicer_migration_reference');
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
               AND information_schema.columns.table_name='roles_categories' AND column_name='is_verification') THEN
        ALTER TABLE _juicer_migration_reference.roles_categories ADD COLUMN is_verification boolean NOT NULL DEFAULT false;
    END IF;

    FOREACH table_name IN ARRAY app_tables LOOP
        signatures := ARRAY[]::jsonb[];
        FOREACH namespace IN ARRAY ARRAY['_juicer_migration_reference', 'public'] LOOP
            SELECT jsonb_build_object(
                'kind', c.relkind, 'persistence', c.relpersistence,
                'rls', c.relrowsecurity, 'force_rls', c.relforcerowsecurity,
                'columns', (SELECT jsonb_agg(jsonb_build_array(a.attname, format_type(a.atttypid,a.atttypmod),
                    a.attnotnull, a.attidentity, a.attgenerated,
                    replace(replace(pg_get_expr(d.adbin,d.adrelid), '_juicer_migration_reference.', ''), 'public.', ''),
                    a.attcollation::regcollation::text) ORDER BY a.attname)
                    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
                    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
                'constraints', (SELECT jsonb_agg(jsonb_build_array(co.contype,co.convalidated,
                    replace(replace(pg_get_constraintdef(co.oid), '_juicer_migration_reference.', ''), 'public.', ''))
                    ORDER BY co.contype, replace(replace(pg_get_constraintdef(co.oid), '_juicer_migration_reference.', ''), 'public.', ''))
                    FROM pg_constraint co WHERE co.conrelid=c.oid),
                'sequences', (SELECT jsonb_agg(jsonb_build_array(a.attname,s.relname,seq.seqtypid::regtype::text,
                    seq.seqstart,seq.seqincrement,seq.seqmax,seq.seqmin,seq.seqcache,seq.seqcycle) ORDER BY a.attname)
                    FROM pg_depend dep JOIN pg_class s ON s.oid=dep.objid AND s.relkind='S'
                    JOIN pg_sequence seq ON seq.seqrelid=s.oid
                    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=dep.refobjsubid
                    WHERE dep.refobjid=c.oid AND dep.deptype='a' AND dep.classid='pg_class'::regclass),
                'triggers', (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal),
                'inheritance', (SELECT count(*) FROM pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid)
            ) INTO actual FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname=namespace AND c.relname=table_name;
            signatures := array_append(signatures,actual);
        END LOOP;
        IF signatures[1] IS DISTINCT FROM signatures[2] THEN
            RAISE EXCEPTION 'Unsupported legacy schema for table %. No application data was changed; inspect columns, constraints, sequences, triggers and RLS', table_name;
        END IF;
    END LOOP;

    -- The performance indexes may all/some already exist; validate any that do.
    CREATE INDEX categories_server_id_idx ON _juicer_migration_reference.categories(server_id);
    CREATE INDEX tags_server_id_idx ON _juicer_migration_reference.tags(server_id);
    CREATE INDEX roles_server_id_idx ON _juicer_migration_reference.roles(server_id);
    CREATE INDEX role_categories_server_id_idx ON _juicer_migration_reference.roles_categories(server_id);
    CREATE INDEX games_server_id_idx ON _juicer_migration_reference.games(server_id);
    CREATE INDEX games_category_id_idx ON _juicer_migration_reference.games(category_id);
    CREATE INDEX games_roles_role_id_idx ON _juicer_migration_reference.games_roles(role_id);
    CREATE INDEX games_tags_tag_id_idx ON _juicer_migration_reference.games_tags(tag_id);
    FOR index_row IN SELECT ci.relname, pg_get_indexdef(i.indexrelid) AS definition
        FROM pg_index i JOIN pg_class ci ON ci.oid=i.indexrelid
        JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='_juicer_migration_reference' AND NOT i.indisprimary
    LOOP
        IF to_regclass('public.' || index_row.relname) IS NOT NULL THEN
            SELECT to_jsonb(replace(pg_get_indexdef(i.indexrelid), 'public.', '')) INTO actual
                FROM pg_index i WHERE i.indexrelid=to_regclass('public.' || index_row.relname)
                AND i.indisvalid AND i.indisready;
            expected := to_jsonb(replace(index_row.definition, '_juicer_migration_reference.', ''));
            IF actual IS DISTINCT FROM expected THEN
                RAISE EXCEPTION 'Unsupported existing index %', index_row.relname;
            END IF;
        END IF;
    END LOOP;
    DROP SCHEMA _juicer_migration_reference CASCADE;
END
$migration$;
