SET LOCAL search_path = public, pg_catalog;
ALTER TABLE roles_categories ADD COLUMN IF NOT EXISTS is_verification boolean NOT NULL DEFAULT false;

-- Preserve the previous Rust startup repair: only the oldest category named
-- verification is flagged, and already-flagged (even renamed) categories win.
UPDATE roles_categories SET is_verification = true
WHERE role_category_id IN (
    SELECT min(rc.role_category_id) FROM roles_categories rc
    WHERE rc.name = 'verification'
      AND NOT EXISTS (
        SELECT 1 FROM roles_categories flagged
        WHERE flagged.server_id=rc.server_id AND flagged.is_verification
      )
    GROUP BY rc.server_id
);
