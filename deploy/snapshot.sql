-- Print only counts and fingerprints, never application records.
-- Run against a RESTORED COPY, with -v normalize_verification=true before the
-- upgrade and false afterward. The sole allowed row change is the old backfill.
\set ON_ERROR_STOP on
SELECT set_config('juicer.normalize_verification', :'normalize_verification', false);
CREATE TEMP TABLE juicer_fingerprints(object_name text, row_count bigint, fingerprint text);
DO $snapshot$
DECLARE
    table_name text;
    row_expression text;
    backfill_pending boolean := true;
BEGIN
    -- On later releases the backfill has already run. Newly created categories
    -- must not be treated as if that one-time migration would run again.
    IF to_regclass('public._sqlx_migrations') IS NOT NULL THEN
        EXECUTE 'SELECT NOT EXISTS (SELECT 1 FROM public._sqlx_migrations WHERE version=2 AND success)'
            INTO backfill_pending;
    END IF;
    FOREACH table_name IN ARRAY ARRAY['servers','categories','tags','roles_categories','roles','games','games_roles','games_tags'] LOOP
        row_expression := 'to_jsonb(t)';
        IF table_name='roles_categories' AND backfill_pending AND current_setting('juicer.normalize_verification')='true' THEN
            row_expression := $row$
                (to_jsonb(t) - 'is_verification') || jsonb_build_object('is_verification',
                    coalesce((to_jsonb(t)->>'is_verification')::boolean,false) OR (
                        t.name='verification'
                        AND t.role_category_id=(SELECT min(rc.role_category_id) FROM public.roles_categories rc WHERE rc.server_id=t.server_id AND rc.name='verification')
                        AND NOT EXISTS (SELECT 1 FROM public.roles_categories rc WHERE rc.server_id=t.server_id AND coalesce((to_jsonb(rc)->>'is_verification')::boolean,false))
                    ))
            $row$;
        END IF;
        EXECUTE format('INSERT INTO juicer_fingerprints SELECT %L,count(*),md5(coalesce(string_agg(md5((%s)::text),'''' ORDER BY md5((%s)::text)),'''')) FROM public.%I t',table_name,row_expression,row_expression,table_name);
    END LOOP;
    FOREACH table_name IN ARRAY ARRAY['categories_category_id_seq','tags_tag_id_seq','roles_categories_role_category_id_seq','games_game_id_seq'] LOOP
        EXECUTE format('INSERT INTO juicer_fingerprints SELECT %L,1,md5(jsonb_build_array(last_value,is_called)::text) FROM public.%I',table_name,table_name);
    END LOOP;
    IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL THEN
        INSERT INTO juicer_fingerprints SELECT 'drizzle.__drizzle_migrations',count(*),md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM drizzle.__drizzle_migrations t;
    END IF;
END
$snapshot$;
SELECT object_name,row_count,fingerprint FROM juicer_fingerprints ORDER BY object_name;
