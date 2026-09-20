SET LOCAL search_path = public, pg_catalog;
-- Existing definitions were checked by the adoption baseline before these
-- IF NOT EXISTS clauses are reached. No existing index is replaced.
CREATE INDEX IF NOT EXISTS categories_server_id_idx ON categories(server_id);
CREATE INDEX IF NOT EXISTS tags_server_id_idx ON tags(server_id);
CREATE INDEX IF NOT EXISTS roles_server_id_idx ON roles(server_id);
CREATE INDEX IF NOT EXISTS role_categories_server_id_idx ON roles_categories(server_id);
CREATE INDEX IF NOT EXISTS games_server_id_idx ON games(server_id);
CREATE INDEX IF NOT EXISTS games_category_id_idx ON games(category_id);
CREATE INDEX IF NOT EXISTS games_roles_role_id_idx ON games_roles(role_id);
CREATE INDEX IF NOT EXISTS games_tags_tag_id_idx ON games_tags(tag_id);
