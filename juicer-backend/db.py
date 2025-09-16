from typing import Optional, Any, List, Dict, Union
import base64
from psycopg import AsyncConnection
from psycopg.errors import UniqueViolation


async def get_server_data_with_details(db: AsyncConnection, server_id: int) -> Optional[Any]:
    """
    Fetches comprehensive server data including roles, categories, tags, and games
    with their nested relationships.

    Args:
        db: Database connection
        server_id: The Discord server ID to fetch data for

    Returns:
        Server data as JSON object or None if server not found
    """
    async with db.cursor() as cursor:
        await cursor.execute("""WITH server_details AS (
  -- Aggregate all top-level info for the server
  SELECT
    s.server_id,
    (SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id)) FROM roles r WHERE r.server_id = s.server_id) AS roles,
    (SELECT json_agg(json_build_object('id', rc.role_category_id, 'name', rc.name)) FROM role_categories rc WHERE rc.server_id = s.server_id) AS role_categories,
    (SELECT json_agg(json_build_object('id', c.category_id, 'name', c.name)) FROM categories c WHERE c.server_id = s.server_id) AS categories,
    (SELECT json_agg(json_build_object('id', t.tag_id, 'name', t.name)) FROM tags t WHERE t.server_id = s.server_id) AS tags,
    -- Aggregate all games and their nested details
    (
      SELECT json_agg(game_data)
      FROM (
        SELECT
          g.game_id AS id,
          g.name,
          g.description,
          json_build_object('id', c.category_id, 'name', c.name) AS category,
          -- Nested aggregation for each game's tags
          (
            SELECT json_agg(json_build_object('id', t.tag_id, 'name', t.name))
            FROM game_tags gt JOIN tags t ON gt.tag_id = t.tag_id
            WHERE gt.game_id = g.game_id
          ) AS tags,
          -- Nested aggregation for each game's roles
          (
            SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id))
            FROM game_roles gr JOIN roles r ON gr.role_id = r.role_id
            WHERE gr.game_id = g.game_id
          ) AS roles_to_add
        FROM games g
        LEFT JOIN categories c ON g.category_id = c.category_id
        WHERE g.server_id = s.server_id
      ) game_data
    ) AS games
  FROM
    servers s
  WHERE
    s.server_id = %s -- The specific server ID
)
-- Final SELECT to build the complete object and handle NULLs
SELECT
  json_build_object(
    'server_id', server_id::text,
    'roles', COALESCE(roles, '[]'::json),
    'role_categories', COALESCE(role_categories, '[]'::json),
    'categories', COALESCE(categories, '[]'::json),
    'tags', COALESCE(tags, '[]'::json),
    'games', COALESCE(games, '[]'::json)
  ) AS server_data
FROM server_details;""", (server_id,))
        result = await cursor.fetchone()
        return result[0] if result else None


# ============================================================================
# SERVER OPERATIONS
# ============================================================================

async def create_server(db: AsyncConnection, server_id: int) -> bool:
    """
    Creates a new server in the database.

    Args:
        db: Database connection
        server_id: The Discord server ID

    Returns:
        True if server was created, False if it already exists
    """
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                "INSERT INTO servers (server_id) VALUES (%s)",
                (server_id,)
            )
            return True
    except UniqueViolation:
        return False  # Server already exists


# ============================================================================
# GAME OPERATIONS
# ============================================================================

async def create_game(db: AsyncConnection, server_id: int, name: str, description: Optional[str] = None, category_id: Optional[int] = None) -> Optional[int]:
    """
    Creates a new game within a server.

    Args:
        db: Database connection
        server_id: The Discord server ID
        name: Game name
        description: Optional game description
        category_id: Optional category ID

    Returns:
        Game ID if created successfully, None if creation failed
    """
    async with db.cursor() as cursor:
        # Verify server exists
        await cursor.execute("SELECT 1 FROM servers WHERE server_id = %s", (server_id,))
        if not await cursor.fetchone():
            raise ValueError(f"Server {server_id} does not exist")

        # Verify category exists and belongs to server if provided
        if category_id:
            await cursor.execute(
                "SELECT 1 FROM categories WHERE category_id = %s AND server_id = %s",
                (category_id, server_id)
            )
            if not await cursor.fetchone():
                raise ValueError(
                    f"Category {category_id} does not exist in server {server_id}")

        await cursor.execute(
            "INSERT INTO games (server_id, name, description, category_id) VALUES (%s, %s, %s, %s) RETURNING game_id",
            (server_id, name, description, category_id)
        )
        result = await cursor.fetchone()
        return result[0] if result else None


async def get_games_by_server(db: AsyncConnection, server_id: int) -> List[Dict[str, Any]]:
    """
    Gets all games within a server with their details.

    Args:
        db: Database connection
        server_id: The Discord server ID

    Returns:
        List of game dictionaries with details
    """
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                g.game_id,
                g.name,
                g.description,
                g.category_id,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.tag_id, 'name', t.name)
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'::json
                ) as tags,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id))
                        FROM game_roles gr JOIN roles r ON gr.role_id = r.role_id
                        WHERE gr.game_id = g.game_id
                    ),
                    '[]'::json
                ) as roles_to_add
            FROM games g
            LEFT JOIN categories c ON g.category_id = c.category_id
            LEFT JOIN game_tags gt ON g.game_id = gt.game_id
            LEFT JOIN tags t ON gt.tag_id = t.tag_id
            WHERE g.server_id = %s
            GROUP BY g.game_id, g.name, g.description, g.category_id, c.name
            ORDER BY g.name
        """, (server_id,))
        results = await cursor.fetchall()
        return [
            {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'category': {'id': row[3], 'name': row[4]},
                'tags': row[5],
                'roles_to_add': row[6]
            }
            for row in results
        ]


async def update_game(db: AsyncConnection, game_id: int, server_id: int, new_name: Optional[str] = None, new_category_id: Optional[int] = None, new_description: Optional[str] = None) -> bool:
    """
    Updates a game's name.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        new_name: New game name (optional)
        new_category_id: New category ID (optional)
        new_description: New game description (optional)
    Returns:
        True if updated successfully, False if game not found
    """
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            return False

        await cursor.execute(
            "UPDATE games SET name = %s, category_id = %s, description = %s WHERE game_id = %s AND server_id = %s",
            (new_name, new_category_id, new_description, game_id, server_id) if new_name and new_category_id and new_description else (
                new_name, new_category_id, game_id, server_id) if new_name and new_category_id else (
                new_name, new_description, game_id, server_id) if new_name and new_description else (
                new_name, game_id, server_id) if new_name else (new_category_id, game_id, server_id)
        )
        return cursor.rowcount > 0


async def update_game_with_tags_and_roles(db: AsyncConnection, game_id: int, server_id: int, new_name: str, new_category_id: int, new_description: str, new_tag_ids: List[int], new_role_ids: List[str]) -> bool:
    """
    Updates a game's name, category, description, tags, and roles.
    """
    new_role_ids = [int(role_id) for role_id in new_role_ids]
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            return False

        await cursor.execute(
            "UPDATE games SET name = %s, category_id = %s, description = %s WHERE game_id = %s AND server_id = %s",
            (new_name, None if new_category_id == "" else new_category_id,
             None if new_description == "" else new_description, game_id, server_id)
        )
        if cursor.rowcount <= 0:
            return False

        # Sync game_tags
        await cursor.execute(
            "SELECT tag_id FROM game_tags WHERE game_id = %s",
            (game_id,)
        )
        existing_tag_rows = await cursor.fetchall()
        existing_tag_ids = {row[0] for row in existing_tag_rows}
        desired_tag_ids = set(new_tag_ids or [])

        tags_to_add = desired_tag_ids - existing_tag_ids
        tags_to_remove = existing_tag_ids - desired_tag_ids

        if tags_to_remove:
            for tag_id in tags_to_remove:
                await cursor.execute(
                    "DELETE FROM game_tags WHERE game_id = %s AND tag_id = %s",
                    (game_id, tag_id)
                )
        if tags_to_add:
            for tag_id in tags_to_add:
                await cursor.execute(
                    "INSERT INTO game_tags (game_id, tag_id) VALUES (%s, %s) ON CONFLICT (game_id, tag_id) DO NOTHING",
                    (game_id, tag_id)
                )

        # Sync game_roles
        await cursor.execute(
            "SELECT role_id FROM game_roles WHERE game_id = %s",
            (game_id,)
        )
        existing_role_rows = await cursor.fetchall()
        existing_role_ids = {row[0] for row in existing_role_rows}
        desired_role_ids = set(new_role_ids or [])

        roles_to_add = desired_role_ids - existing_role_ids
        roles_to_remove = existing_role_ids - desired_role_ids

        # print("Roles to add: ", roles_to_add)
        # print("Roles to remove: ", roles_to_remove)

        if roles_to_remove:
            for role_id in roles_to_remove:
                await cursor.execute(
                    "DELETE FROM game_roles WHERE game_id = %s AND role_id = %s",
                    (game_id, role_id)
                )
        if roles_to_add:
            for role_id in roles_to_add:
                await cursor.execute(
                    "INSERT INTO game_roles (game_id, role_id) VALUES (%s, %s) ON CONFLICT (game_id, role_id) DO NOTHING",
                    (game_id, role_id)
                )

        return True


async def delete_game(db: AsyncConnection, game_id: int, server_id: int) -> bool:
    """
    Deletes a game by ID and server ID.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)

    Returns:
        True if deleted successfully, False if game not found
    """
    async with db.cursor() as cursor:
        await cursor.execute(
            "DELETE FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        return cursor.rowcount > 0


# ============================================================================
# GAME THUMBNAIL OPERATIONS
# ============================================================================

async def add_or_update_game_thumbnail(db: AsyncConnection, game_id: int, server_id: int, thumbnail_file: Union[str, bytes, bytearray]) -> bool:
    """
    Adds or overwrites a game's thumbnail image. Enforces 1 MB max size.

    Args:
        db: Database connection
        game_id: Game ID
        server_id: Server ID (ownership check)
        thumbnail_file: SpooledTemporaryFile containing image bytes

    Returns:
        True if updated, False if game not found
    """
    # Normalize input to bytes
    image_bytes: bytes
    if isinstance(thumbnail_file, (bytes, bytearray)):
        image_bytes = bytes(thumbnail_file)
    elif isinstance(thumbnail_file, str):
        data_str = thumbnail_file.strip()
        # Handle data URL (e.g., "data:image/webp;base64,....")
        if data_str.startswith("data:") and "," in data_str:
            try:
                base64_part = data_str.split(",", 1)[1]
                image_bytes = base64.b64decode(base64_part, validate=False)
            except Exception:
                # Fallback: try decoding the whole string
                image_bytes = base64.b64decode(data_str, validate=False)
        else:
            # Assume plain base64 string
            image_bytes = base64.b64decode(data_str, validate=False)
    else:
        # Unsupported type
        raise ValueError("thumbnail_file must be bytes or base64 string")

    # Enforce 1 MB limit proactively to avoid DB error
    if len(image_bytes) > 1048576:
        raise ValueError("Thumbnail exceeds 1 MB size limit")

    async with db.cursor() as cursor:
        # Ensure the game belongs to the server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            return False

        await cursor.execute(
            "UPDATE games SET thumbnail = %s WHERE game_id = %s AND server_id = %s",
            (image_bytes, game_id, server_id)
        )
        return cursor.rowcount > 0


async def delete_game_thumbnail(db: AsyncConnection, game_id: int, server_id: int) -> bool:
    """
    Deletes a game's thumbnail (sets to NULL).

    Args:
        db: Database connection
        game_id: Game ID
        server_id: Server ID (ownership check)

    Returns:
        True if updated, False if game not found
    """
    async with db.cursor() as cursor:
        await cursor.execute(
            "UPDATE games SET thumbnail = NULL WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        return cursor.rowcount > 0


async def get_game_thumbnail(db: AsyncConnection, game_id: int, server_id: int) -> Optional[bytes]:
    """
    Retrieves a game's thumbnail bytes.

    Returns None if game not found or thumbnail is NULL.
    """
    async with db.cursor() as cursor:
        await cursor.execute(
            "SELECT thumbnail FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return row[0]


# ============================================================================
# TAG OPERATIONS
# ============================================================================

async def add_tags_to_game(db: AsyncConnection, game_id: int, server_id: int, tag_names: List[str]) -> bool:
    """
    Adds one or more tags to a game. Creates tags if they don't exist.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        tag_names: List of tag names to add

    Returns:
        True if all tags were added successfully
    """
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(f"Game {game_id} not found in server {server_id}")

        for tag_name in tag_names:
            # Create tag if it doesn't exist
            await cursor.execute("""
                INSERT INTO tags (server_id, name) 
                VALUES (%s, %s) 
                ON CONFLICT (server_id, name) DO NOTHING
            """, (server_id, tag_name))

            # Get tag ID
            await cursor.execute(
                "SELECT tag_id FROM tags WHERE server_id = %s AND name = %s",
                (server_id, tag_name)
            )
            tag_result = await cursor.fetchone()
            if not tag_result:
                continue

            tag_id = tag_result[0]

            # Add tag to game (ignore if already exists)
            await cursor.execute("""
                INSERT INTO game_tags (game_id, tag_id) 
                VALUES (%s, %s) 
                ON CONFLICT (game_id, tag_id) DO NOTHING
            """, (game_id, tag_id))

        return True


async def create_tag(db: AsyncConnection, server_id: int, name: str) -> Optional[int]:
    """
    Creates a new tag in the database.
    """
    async with db.cursor() as cursor:
        try:
            await cursor.execute("INSERT INTO tags (server_id, name) VALUES (%s, %s)", (server_id, name))
            return True
        except UniqueViolation:
            return None  # Tag already exists
        except Exception as e:
            raise ValueError(f"Failed to create tag: {str(e)}")


async def add_tags_to_game_by_ids(db: AsyncConnection, game_id: int, server_id: int, tag_ids: List[int]) -> bool:
    """
    Adds one or more tags to a game by IDs.
    """
    async with db.cursor() as cursor:
        for tag_id in tag_ids:
            # Verify tag exists in the specified server
            await cursor.execute(
                "SELECT 1 FROM tags WHERE tag_id = %s AND server_id = %s",
                (tag_id, server_id)
            )
            if not await cursor.fetchone():
                raise ValueError(
                    f"Tag {tag_id} not found in server {server_id}")

            # Verify game exists in the specified server
            await cursor.execute(
                "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
                (game_id, server_id)
            )
            if not await cursor.fetchone():
                raise ValueError(
                    f"Game {game_id} not found in server {server_id}")

            # Add tag to game (ignore if already exists)
            await cursor.execute("""
                INSERT INTO game_tags (game_id, tag_id) 
                VALUES (%s, %s) 
                ON CONFLICT (game_id, tag_id) DO NOTHING
            """, (game_id, tag_id))
        return True


async def remove_tag_from_game(db: AsyncConnection, game_id: int, server_id: int, tag_name: str) -> bool:
    """
    Removes a tag from a game.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        tag_name: Name of the tag to remove

    Returns:
        True if tag was removed, False if tag or game not found
    """
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            return False

        # Remove the tag from the game
        await cursor.execute("""
            DELETE FROM game_tags 
            WHERE game_id = %s 
            AND tag_id = (
                SELECT tag_id FROM tags 
                WHERE server_id = %s AND name = %s
            )
        """, (game_id, server_id, tag_name))

        return cursor.rowcount > 0


# remove tag from DB, by ID
async def remove_tag_by_id(db: AsyncConnection, tag_id: int) -> bool:
    """
    Removes a tag from the database.
    """
    async with db.cursor() as cursor:
        await cursor.execute("DELETE FROM tags WHERE tag_id = %s", (tag_id,))
        return cursor.rowcount > 0


async def get_all_tags_in_server(db: AsyncConnection, server_id: int) -> List[Dict[str, Any]]:
    """
    Gets all tags for a given server.
    """
    async with db.cursor() as cursor:
        await cursor.execute("SELECT tag_id, name FROM tags WHERE server_id = %s", (server_id,))
        results = await cursor.fetchall()
        return [{'tag_id': row[0], 'name': row[1]} for row in results]

# ============================================================================
# ROLE OPERATIONS
# ============================================================================


async def map_roles_to_game(db: AsyncConnection, game_id: int, server_id: int, role_ids: List[str]) -> bool:
    """
    Maps one or more roles to a game.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        role_ids: List of role IDs to map

    Returns:
        True if all roles were mapped successfully
    """
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(f"Game {game_id} not found in server {server_id}")

        for role_id_str in role_ids:
            role_id = int(role_id_str)
            # Verify role exists in the server
            await cursor.execute(
                "SELECT 1 FROM roles WHERE role_id = %s AND server_id = %s",
                (role_id, server_id)
            )
            if not await cursor.fetchone():
                raise ValueError(
                    f"Role {role_id} not found in server {server_id}")

            # Map role to game (ignore if already exists)
            await cursor.execute("""
                INSERT INTO game_roles (game_id, role_id) 
                VALUES (%s, %s) 
                ON CONFLICT (game_id, role_id) DO NOTHING
            """, (game_id, role_id))

        return True


async def get_game_roles(db: AsyncConnection, game_id: int, server_id: int) -> List[Dict[str, Any]]:
    """
    Gets all roles mapped to a game.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)

    Returns:
        List of role dictionaries
    """
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT r.role_id::text
            FROM game_roles gr
            JOIN roles r ON gr.role_id = r.role_id
            JOIN games g ON gr.game_id = g.game_id
            WHERE g.game_id = %s AND g.server_id = %s
            ORDER BY r.role_id
        """, (game_id, server_id))
        results = await cursor.fetchall()
        return [{'role_id': row[0]} for row in results]


async def create_role_in_db(db: AsyncConnection, server_id: int, role_id: int) -> bool:
    """
    Creates a role in the database.

    Args:
        db: Database connection
        server_id: The Discord server ID
        role_id: The Discord role ID

    Returns:
        True if role was created, False if it already exists
    """
    try:
        async with db.cursor() as cursor:
            await cursor.execute(
                "INSERT INTO roles (role_id, server_id) VALUES (%s, %s)",
                (role_id, server_id)
            )
            return True
    except UniqueViolation:
        return False  # Role already exists


async def get_all_roles_in_server(db: AsyncConnection, server_id: int) -> List[Dict[str, Any]]:
    """
    Gets all roles for a given server.

    Args:
        db: Database connection
        server_id: The Discord server ID

    Returns:
        List of role dictionaries with role_id
    """
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT role_id::text
            FROM roles
            WHERE server_id = %s
            ORDER BY role_id
        """, (server_id,))
        results = await cursor.fetchall()
        return [{'role_id': row[0]} for row in results]


async def handle_discord_role_removed(db: AsyncConnection, role_id: int, server_id: int, delete_role_record: bool = True) -> Dict[str, Any]:
    """
    Handles the removal of a Discord role from a server.
    This function can either delete the role record (which cascades to game mappings)
    or just clean up the game mappings while keeping the role record.

    Args:
        db: Database connection
        role_id: The Discord role ID that was removed
        server_id: The server ID (for security)
        delete_role_record: If True, deletes the role from roles table (cascades to mappings).
                          If False, only removes mappings but keeps role record.

    Returns:
        Dictionary with operation results including affected games
    """
    async with db.cursor() as cursor:
        # Verify role exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM roles WHERE role_id = %s AND server_id = %s",
            (role_id, server_id)
        )
        role_result = await cursor.fetchone()
        if not role_result:
            return {
                'success': False,
                'message': f"Role {role_id} not found in server {server_id}",
                'affected_games': []
            }

        # Get all games that have this role mapped (for reporting)
        await cursor.execute("""
            SELECT DISTINCT g.game_id, g.name
            FROM game_roles gr
            JOIN games g ON gr.game_id = g.game_id
            WHERE gr.role_id = %s AND g.server_id = %s
            ORDER BY g.name
        """, (role_id, server_id))
        affected_games = await cursor.fetchall()
        games_list = [{'game_id': row[0], 'name': row[1]}
                      for row in affected_games]

        if delete_role_record:
            # Delete the role from roles table - this will cascade delete all mappings
            await cursor.execute(
                "DELETE FROM roles WHERE role_id = %s AND server_id = %s",
                (role_id, server_id)
            )

            if cursor.rowcount > 0:
                return {
                    'success': True,
                    'message': f"Role {role_id} deleted from server {server_id}. {len(games_list)} game(s) had this role mapped.",
                    'affected_games': games_list,
                    'action': 'deleted_role_and_mappings'
                }
            else:
                return {
                    'success': False,
                    'message': f"Failed to delete role {role_id}",
                    'affected_games': games_list
                }
        else:
            # Only remove the mappings, keep the role record
            await cursor.execute(
                "DELETE FROM game_roles WHERE role_id = %s",
                (role_id,)
            )

            mappings_removed = cursor.rowcount

            return {
                'success': True,
                'message': f"Removed role {role_id} from {mappings_removed} game mapping(s). Role record kept in database.",
                'affected_games': games_list,
                'mappings_removed': mappings_removed,
                'action': 'removed_mappings_only'
            }


# ============================================================================
# CATEGORY OPERATIONS
# ============================================================================

async def map_category_to_game(db: AsyncConnection, game_id: int, server_id: int, category_id: int) -> bool:
    """
    Maps a category to a game.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        category_id: The category ID

    Returns:
        True if category was mapped successfully
    """
    async with db.cursor() as cursor:
        # Verify game exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM games WHERE game_id = %s AND server_id = %s",
            (game_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(f"Game {game_id} not found in server {server_id}")

        # Verify category exists in the server
        await cursor.execute(
            "SELECT 1 FROM categories WHERE category_id = %s AND server_id = %s",
            (category_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(
                f"Category {category_id} not found in server {server_id}")

        # Update game's category
        await cursor.execute(
            "UPDATE games SET category_id = %s WHERE game_id = %s AND server_id = %s",
            (category_id, game_id, server_id)
        )

        return cursor.rowcount > 0


async def create_category(db: AsyncConnection, server_id: int, name: str) -> Optional[int]:
    """
    Creates a category in a server.

    Args:
        db: Database connection
        server_id: The Discord server ID
        name: Category name

    Returns:
        Category ID if created successfully, None if category name already exists
    """
    try:
        async with db.cursor() as cursor:
            # Verify server exists
            await cursor.execute("SELECT 1 FROM servers WHERE server_id = %s", (server_id,))
            if not await cursor.fetchone():
                raise ValueError(f"Server {server_id} does not exist")

            await cursor.execute(
                "INSERT INTO categories (server_id, name) VALUES (%s, %s) RETURNING category_id",
                (server_id, name)
            )
            result = await cursor.fetchone()
            return result[0] if result else None
    except UniqueViolation:
        return None  # Category name already exists in server


async def delete_category(db: AsyncConnection, category_id: int, server_id: int) -> Dict[str, Any]:
    """
    Deletes a category by ID. Refuses to delete if games are referencing it.

    Args:
        db: Database connection
        category_id: The category ID to delete
        server_id: The server ID (for security)

    Returns:
        Dictionary with 'success' boolean and 'message' string.
        If success is False, 'games' key contains list of games referencing the category.
    """
    async with db.cursor() as cursor:
        # Verify category exists in the specified server
        await cursor.execute(
            "SELECT 1 FROM categories WHERE category_id = %s AND server_id = %s",
            (category_id, server_id)
        )
        if not await cursor.fetchone():
            return {
                'success': False,
                'message': f"Category {category_id} not found in server {server_id}"
            }

        # Check if any games are referencing this category.
        await cursor.execute("""
            SELECT g.game_id, g.name
            FROM games g
            WHERE g.category_id = %s AND g.server_id = %s
            ORDER BY g.name
        """, (category_id, server_id))
        referencing_games = await cursor.fetchall()

        if referencing_games:
            games_list = [{'game_id': row[0], 'name': row[1]}
                          for row in referencing_games]
            return {
                'success': False,
                'message': f"Cannot delete category {category_id}. {len(games_list)} game(s) still have reference to it.",
                'games': games_list
            }

        # Safe to delete - no games are referencing this category
        await cursor.execute(
            "DELETE FROM categories WHERE category_id = %s AND server_id = %s",
            (category_id, server_id)
        )

        if cursor.rowcount > 0:
            return {
                'success': True,
                'message': f"Category {category_id} deleted successfully"
            }
        else:
            return {
                'success': False,
                'message': f"Failed to delete category {category_id}"
            }


# ============================================================================
# ROLE CATEGORY OPERATIONS
# ============================================================================

async def create_role_category(db: AsyncConnection, server_id: int, name: str) -> Optional[int]:
    """
    Creates a role category for a server and returns its ID.
    """
    async with db.cursor() as cursor:
        # Verify server exists
        await cursor.execute("SELECT 1 FROM servers WHERE server_id = %s", (server_id,))
        if not await cursor.fetchone():
            raise ValueError(f"Server {server_id} does not exist")

        await cursor.execute(
            "INSERT INTO role_categories (server_id, name) VALUES (%s, %s) RETURNING role_category_id",
            (server_id, name)
        )
        row = await cursor.fetchone()
        return row[0] if row else None


async def delete_role_category(db: AsyncConnection, role_category_id: int, server_id: int) -> Dict[str, Any]:
    """
    Deletes a role category by ID for a server.
    Refuses to delete if any roles reference it and returns those role IDs.
    """
    async with db.cursor() as cursor:
        # Verify category exists in this server
        await cursor.execute(
            "SELECT 1 FROM role_categories WHERE role_category_id = %s AND server_id = %s",
            (role_category_id, server_id)
        )
        if not await cursor.fetchone():
            return {
                'success': False,
                'message': f"Role category {role_category_id} not found in server {server_id}"
            }

        # Check roles referencing this category
        await cursor.execute(
            "SELECT role_id FROM roles WHERE role_category_id = %s AND server_id = %s",
            (role_category_id, server_id)
        )
        role_rows = await cursor.fetchall()
        if role_rows:
            role_ids = [str(row[0]) for row in role_rows]
            return {
                'success': False,
                'message': f"Cannot delete role category {role_category_id}. {len(role_ids)} role(s) reference it.",
                'roles': role_ids
            }

        # Safe to delete
        await cursor.execute(
            "DELETE FROM role_categories WHERE role_category_id = %s AND server_id = %s",
            (role_category_id, server_id)
        )

        if cursor.rowcount > 0:
            return {'success': True, 'message': f"Role category {role_category_id} deleted"}
        else:
            return {'success': False, 'message': f"Failed to delete role category {role_category_id}"}


async def map_role_category_to_role(db: AsyncConnection, role_id: int, role_category_id: int | None, server_id: int) -> bool:
    """
    Maps a role category to a role (each role can have zero or one category).
    """
    async with db.cursor() as cursor:
        if role_category_id is None:
            # unassign the role category from the role
            await cursor.execute(
                "UPDATE roles SET role_category_id = NULL WHERE role_id = %s AND server_id = %s",
                (role_id, server_id)
            )
            return cursor.rowcount > 0

        # Verify role exists in server
        await cursor.execute(
            "SELECT 1 FROM roles WHERE role_id = %s AND server_id = %s",
            (role_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(f"Role {role_id} not found in server {server_id}")

        # Verify category exists in server
        await cursor.execute(
            "SELECT 1 FROM role_categories WHERE role_category_id = %s AND server_id = %s",
            (role_category_id, server_id)
        )
        if not await cursor.fetchone():
            raise ValueError(
                f"Role category {role_category_id} not found in server {server_id}")

        await cursor.execute(
            "UPDATE roles SET role_category_id = %s WHERE role_id = %s AND server_id = %s",
            (role_category_id, role_id, server_id)
        )
        return cursor.rowcount > 0

# ============================================================================
# SEARCH OPERATIONS
# ============================================================================


async def find_games_by_category(db: AsyncConnection, server_id: int, category_name: str) -> List[Dict[str, Any]]:
    """
    Finds games by category name within a server.

    Args:
        db: Database connection
        server_id: The Discord server ID
        category_name: The category name to search for

    Returns:
        List of game dictionaries in the specified category
    """
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                g.game_id,
                g.name,
                g.description,
                g.category_id,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.tag_id, 'name', t.name)
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'::json
                ) as tags,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id))
                        FROM game_roles gr JOIN roles r ON gr.role_id = r.role_id
                        WHERE gr.game_id = g.game_id
                    ),
                    '[]'::json
                ) as roles_to_add
            FROM games g
            JOIN categories c ON g.category_id = c.category_id
            LEFT JOIN game_tags gt ON g.game_id = gt.game_id
            LEFT JOIN tags t ON gt.tag_id = t.tag_id
            WHERE g.server_id = %s AND c.name = %s
            GROUP BY g.game_id, g.name, g.description, g.category_id, c.name
            ORDER BY g.name
        """, (server_id, category_name))
        results = await cursor.fetchall()
        return [
            {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'category': {'id': row[3], 'name': row[4]},
                'tags': row[5],
                'roles_to_add': row[6]
            }
            for row in results
        ]


async def find_games_by_tags(db: AsyncConnection, server_id: int, tag_names: List[str]) -> List[Dict[str, Any]]:
    """
    Finds games with specified tags within a server.

    Args:
        db: Database connection
        server_id: The Discord server ID
        tag_names: List of tag names to search for

    Returns:
        List of game dictionaries that have all specified tags
    """
    async with db.cursor() as cursor:
        # SECURITY: Use parameterized query to prevent SQL injection
        if not tag_names:
            return []

        # Build the query to find games that have ALL specified tags
        placeholders = ','.join(['%s'] * len(tag_names))
        query = f"""
            SELECT 
                g.game_id,
                g.name,
                g.description,
                g.category_id,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.tag_id, 'name', t.name)
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'::json
                ) as tags,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id))
                        FROM game_roles gr JOIN roles r ON gr.role_id = r.role_id
                        WHERE gr.game_id = g.game_id
                    ),
                    '[]'::json
                ) as roles_to_add
            FROM games g
            LEFT JOIN categories c ON g.category_id = c.category_id
            LEFT JOIN game_tags gt ON g.game_id = gt.game_id
            LEFT JOIN tags t ON gt.tag_id = t.tag_id
            WHERE g.server_id = %s
            AND g.game_id IN (
                SELECT gt2.game_id
                FROM game_tags gt2
                JOIN tags t2 ON gt2.tag_id = t2.tag_id
                WHERE t2.server_id = %s AND t2.name IN ({placeholders})
                GROUP BY gt2.game_id
                HAVING COUNT(DISTINCT t2.name) = %s
            )
            GROUP BY g.game_id, g.name, g.description, g.category_id, c.name
            ORDER BY g.name
        """
        await cursor.execute(query, (server_id, server_id, *tag_names, len(tag_names)))
        results = await cursor.fetchall()
        return [
            {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'category': {'id': row[3], 'name': row[4]},
                'tags': row[5],
                'roles_to_add': row[6]
            }
            for row in results
        ]


async def find_games_by_name(db: AsyncConnection, server_id: int, name_query: str) -> List[Dict[str, Any]]:
    """
    Searches for games by name within a server.
    """
    async with db.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                g.game_id,
                g.name,
                g.description,
                g.category_id,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.tag_id, 'name', t.name)
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'::json
                ) as tags,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', r.role_id::text, 'role_category_id', r.role_category_id))
                        FROM game_roles gr JOIN roles r ON gr.role_id = r.role_id
                        WHERE gr.game_id = g.game_id
                    ),
                    '[]'::json
                ) as roles_to_add
            FROM games g
            LEFT JOIN categories c ON g.category_id = c.category_id
            LEFT JOIN game_tags gt ON g.game_id = gt.game_id
            LEFT JOIN tags t ON gt.tag_id = t.tag_id
            WHERE g.server_id = %s AND g.name ILIKE %s
            GROUP BY g.game_id, g.name, g.description, g.category_id, c.name
            ORDER BY g.name
        """, (server_id, f"%{name_query}%"))
        results = await cursor.fetchall()
        return [
            {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'category': {'id': row[3], 'name': row[4]},
                'tags': row[5],
                'roles_to_add': row[6]
            }
            for row in results
        ]
