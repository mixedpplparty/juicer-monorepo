from typing import Optional, Any, List, Dict
from psycopg import AsyncConnection
from psycopg.errors import UniqueViolation, ForeignKeyViolation


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
    (SELECT json_agg(json_build_object('id', r.role_id)) FROM roles r WHERE r.server_id = s.server_id) AS roles,
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
            SELECT json_agg(json_build_object('id', r.role_id))
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
    'server_id', server_id,
    'roles', COALESCE(roles, '[]'::json),
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
                ) as tags
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
                'game_id': row[0],
                'name': row[1],
                'description': row[2],
                'category_id': row[3],
                'category_name': row[4],
                'tags': row[5]
            }
            for row in results
        ]


async def update_game_name(db: AsyncConnection, game_id: int, server_id: int, new_name: str) -> bool:
    """
    Updates a game's name.

    Args:
        db: Database connection
        game_id: The game ID
        server_id: The server ID (for security)
        new_name: New game name

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
            "UPDATE games SET name = %s WHERE game_id = %s AND server_id = %s",
            (new_name, game_id, server_id)
        )
        return cursor.rowcount > 0


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


# ============================================================================
# ROLE OPERATIONS
# ============================================================================

async def map_roles_to_game(db: AsyncConnection, game_id: int, server_id: int, role_ids: List[int]) -> bool:
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

        for role_id in role_ids:
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
            SELECT r.role_id
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
            SELECT role_id
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

        # Check if any games are referencing this category
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
                'message': f"Cannot delete category {category_id}. {len(games_list)} game(s) are still referencing it.",
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
                ) as tags
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
                'game_id': row[0],
                'name': row[1],
                'description': row[2],
                'category_id': row[3],
                'category_name': row[4],
                'tags': row[5]
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
        # Build the query to find games that have ALL specified tags
        placeholders = ','.join(['%s'] * len(tag_names))
        await cursor.execute(f"""
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
                ) as tags
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
        """, (server_id, server_id, *tag_names, len(tag_names)))
        results = await cursor.fetchall()
        return [
            {
                'game_id': row[0],
                'name': row[1],
                'description': row[2],
                'category_id': row[3],
                'category_name': row[4],
                'tags': row[5]
            }
            for row in results
        ]
