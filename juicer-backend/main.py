from api import exchange_code_async, refresh_token_async, revoke_token_async, discord_user_get_data
from db import add_tags_to_game, create_category, create_game, create_role_in_db, create_server, delete_category, delete_game, find_games_by_category, find_games_by_name, find_games_by_tags, get_all_roles_in_server, get_game_roles, get_games_by_server, get_server_data_with_details, handle_discord_role_removed, map_category_to_game, map_roles_to_game, remove_tag_by_id, remove_tag_from_game, update_game
import discord
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import RedirectResponse, JSONResponse
from typing import List, Union
import os
import sys
from fastapi import Response
from fastapi import Cookie, HTTPException, status
from typing import Optional
from dotenv import load_dotenv
from psycopg_pool import AsyncConnectionPool
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import Depends, FastAPI, HTTPException
file_dir = os.path.dirname(__file__)
sys.path.append(file_dir)

# create intents
intents = discord.Intents.default()
intents.dm_messages = True
intents.guilds = True
intents.members = True

# create client
discord_client = discord.Client(intents=intents)

# load .env
load_dotenv()
REDIRECT_AFTER_SIGN_IN_URI = os.environ.get('REDIRECT_AFTER_SIGN_IN_URI')
REDIRECT_AFTER_SIGN_IN_FAILED_URI = os.environ.get(
    'REDIRECT_AFTER_SIGN_IN_FAILED_URI')
POSTGRES_DB = os.environ.get('POSTGRES_DB')
POSTGRES_USER = os.environ.get(
    'POSTGRES_USER')
POSTGRES_PASSWORD = os.environ.get(
    'POSTGRES_PASSWORD')
POSTGRES_PORT = os.environ.get(
    'POSTGRES_PORT')

# allowed origins(cors)
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost",
    "http://127.0.0.1",
]


# db-related
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@db:{POSTGRES_PORT}/{POSTGRES_DB}"
print(DATABASE_URL)
db_pool: AsyncConnectionPool | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    global db_pool
    print("Starting up and creating connection pool...")
    # Initialize the connection pool
    db_pool = AsyncConnectionPool(
        conninfo=DATABASE_URL,
        min_size=5,  # Minimum number of connections to keep open
        max_size=20  # Maximum number of connections in the pool
    )
    print("Starting Discord client...")
    asyncio.create_task(discord_client.start(
        os.environ.get('DISCORD_BOT_TOKEN')))
    print("Discord client started")
    yield
    # This part runs on shutdown
    print("Shutting down and closing connection pool...")
    if db_pool:
        await db_pool.close()
    await discord_client.close()
    print("Discord client stopped")

# fastapi
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # for cookie ping-pong
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


async def get_db() -> AsyncGenerator[any, any]:
    """
    Dependency to get a database connection from the pool.
    This ensures the connection is returned to the pool after the request is finished.
    """
    if db_pool is None:
        raise RuntimeError("Database connection pool is not initialized.")

    # Borrow a connection from the pool for the duration of one request
    async with db_pool.connection() as conn:
        try:
            yield conn
        finally:
            # The 'async with' block automatically returns the connection to the pool
            pass


async def authenticate_and_authorize_user(server_id: int, discord_access_token: Optional[str] = None, require_manage_guild: bool = False) -> dict:
    """
    Common authentication and authorization function for Discord server endpoints.

    Args:
        server_id: The Discord server ID
        discord_access_token: Optional Discord access token from cookies
        require_manage_guild: If True, requires user to have manage_guild permission

    Returns:
        Dictionary containing user_data and guild information

    Raises:
        HTTPException: For authentication/authorization failures
    """
    # Auth check
    try:
        user_data = await discord_user_get_data(discord_access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated."
        )

    # Check if bot is in that server and user is in that server
    guild = discord_client.get_guild(server_id)
    if not guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found. Bot may not be in that server."
        )
    if guild.get_member(int(user_data.get("id"))) is None:  # must be int
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User not in server."
        )

    # Check manage guild permission if required
    if require_manage_guild:
        if not guild.get_member(int(user_data.get("id"))).guild_permissions.manage_guild:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not have manage server permission in that server."
            )

    return {
        "user_data": user_data,
        "guild": guild
    }


# USER OAuth Endpoints


@app.get("/discord/auth/callback")
async def discord_callback(code: str, response: Response):
    try:
        token_data = await exchange_code_async(code)
        access_token = token_data.get("access_token")

        # redirect response for FE
        response = RedirectResponse(url=REDIRECT_AFTER_SIGN_IN_URI)

        if not access_token:
            # err
            return RedirectResponse(url=REDIRECT_AFTER_SIGN_IN_FAILED_URI)

        # http-only cookie
        response.set_cookie(
            key="discord_access_token",
            value=access_token,
            httponly=True,  # prevents js access
            samesite="lax",  # allow cross-site cookies for localhost:5173
            secure=False,    # set True when serving over HTTPS
            # Set cookie expiry from token
            max_age=token_data.get("expires_in"),
        )

        # refresh token
        refresh_token = token_data.get("refresh_token")
        if refresh_token:
            response.set_cookie(
                key="discord_refresh_token",
                value=refresh_token,
                httponly=True,  # prevents js access
                samesite="lax",  # allow cross-site cookies for localhost:5173
                secure=False,    # set True when serving over HTTPS
                # Set cookie expiry from token
                max_age=token_data.get("expires_in"),
            )

        return response

    except Exception as e:
        # Redirect to a failure page on your frontend
        return RedirectResponse(url=REDIRECT_AFTER_SIGN_IN_FAILED_URI)


@app.get("/discord/auth/me")
async def read_current_user(discord_access_token: Optional[str] = Cookie(None), discord_refresh_token: Optional[str] = Cookie(None), response: Response = Response):
    """
    Fetches the current user's data based on the access_token cookie.
    """

    response = JSONResponse(content={"discord_access_token": discord_access_token,
                            "discord_refresh_token": discord_refresh_token if discord_refresh_token else None})

    if discord_access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. No access token found in cookies.",
        )

    try:
        user_data = await discord_user_get_data(discord_access_token)
    except Exception as e:
        response = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated. Invalid access token. Cookies removed."})
        response.delete_cookie("discord_access_token")
        response.delete_cookie("discord_refresh_token")
        return response
    return response


@app.post("/discord/auth/refresh")
async def discord_refresh(discord_refresh_token: Optional[str] = Cookie(None), response: Response = Response):
    try:
        user_data = await discord_user_get_data(discord_refresh_token)
    except Exception as e:
        response = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated. Invalid refresh token. Cookies removed."})
        response.delete_cookie("discord_access_token")
        response.delete_cookie("discord_refresh_token")
        return response
    try:
        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"detail": "Token refreshed."})
        refresh_token = await refresh_token_async(discord_refresh_token)
        response.set_cookie(
            key="discord_access_token",
            value=refresh_token.get("access_token"),
            httponly=True,  # prevents js access
            samesite="lax",  # allow cross-site cookies for localhost:5173
            secure=False,    # set True when serving over HTTPS
            # Set cookie expiry from token
            max_age=refresh_token.get("expires_in"),
        )
        response.set_cookie(
            key="discord_refresh_token",
            value=refresh_token.get("refresh_token"),
            httponly=True,  # prevents js access
            samesite="lax",  # allow cross-site cookies for localhost:5173
            secure=False,    # set True when serving over HTTPS
            # Set cookie expiry from token
            max_age=refresh_token.get("expires_in"),
        )
        return response
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Failed to refresh token: {str(e)}"}
        )


@app.post("/discord/auth/revoke")
async def discord_revoke(response: Response, discord_access_token: Optional[str] = Cookie(None)):
    try:
        res = await revoke_token_async(discord_access_token)
        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"detail": "Token revoked."})
        response.delete_cookie("discord_access_token")
        response.delete_cookie("discord_refresh_token")
        return response
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Failed to revoke token: {str(e)}"}
        )


@app.get("/discord/auth/remove-cookies")
async def discord_remove_cookies(response: Response):
    response.delete_cookie("discord_access_token")
    response.delete_cookie("discord_refresh_token")
    return {"message": "Cookies removed"}


@app.get("/discord/user-data")
async def get_discord_user_data(discord_access_token: Optional[str] = Cookie(None)):
    """
    Fetches the current user's Discord data using the access token from cookies.
    """
    if discord_access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. No access token found in cookies.",
        )

    try:
        user_data = await discord_user_get_data(discord_access_token)
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user data: {str(e)}"
        )

# server that both the user and the bot is in


@discord_client.event
@app.get("/discord/user/me")
async def get_db_member_data(discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    # auth check
    res = {"me": {}, "guilds": []}
    try:
        user_data = await discord_user_get_data(discord_access_token)
        res["me"] = user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated."
        )
    try:
        user = await discord_client.fetch_user(int(user_data.get("id")))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user data: {str(e)}"
        )
    guilds = user.mutual_guilds
    for guild in guilds:
        res["guilds"].append({
            "id": str(guild.id),
            "name": guild.name,
            "icon": guild.icon.url if guild.icon else None,
            "owner_id": str(guild.owner_id),
            "owner_name": guild.owner.name,
            "owner_nick": guild.owner.nick,
            "member_count": guild.member_count,
        })
    return res


@discord_client.event
@app.get("/discord/server/{server_id}")
async def get_db_server_data(server_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    auth_data = await authenticate_and_authorize_user(server_id, discord_access_token)
    user_data = auth_data["user_data"]
    guild = auth_data["guild"]

    res = {}

    # determine if user has manage server permission
    if guild.get_member(int(user_data.get("id"))).guild_permissions.manage_guild:
        # admin
        res["admin"] = True
    else:
        # user
        res["admin"] = False

    # server data from discord.py
    # assumes roles are synced
    res["server_data_discord"] = {
        "id": str(guild.id),
        "name": guild.name,
        "icon": guild.icon.url if guild.icon else None,
        "owner_id": str(guild.owner_id),
        "owner_name": guild.owner.name,
        "owner_nick": guild.owner.nick,
        "member_count": guild.member_count,
    }

    try:
        server_data = await get_server_data_with_details(db, server_id)
        res["server_data_db"] = server_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch server data: {str(e)}"
        )
    return res


@discord_client.event
@app.post("/discord/server/{server_id}/create")
async def create_server_request(server_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await create_server(db, server_id)
        if res:
            return {"message": "Server created. Roles need to be synced."}
        elif not res:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Server already exists."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create server."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create server: {str(e)}"
        )

# assume all role-related jobs will be done on the Discord side


@discord_client.event
@app.get("/discord/server/{server_id}/roles")
async def get_roles(server_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    auth_data = await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)
    guild = auth_data["guild"]

    roles = guild.roles
    res = []
    for role in roles:
        res.append({
            "id": str(role.id),
            "name": role.name,
            "color": role.color.to_rgb(),
            "is_default": role.is_default(),
            "icon": role.icon.url if role.icon else None
        })
    return res


@discord_client.event
@app.get("/discord/server/{server_id}/sync-roles")
async def sync_roles(server_id: int, db: AsyncGenerator[any, any] = Depends(get_db)):
    # auth not required
    # check if bot is in that server
    guild = discord_client.get_guild(server_id)
    if not guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server not found. Bot may not be in that server."
        )

    roles = guild.roles
    # add try-catch for db operations
    res = {
        "roles_created": [],
        "roles_deleted": []
    }
    try:
        db_roles = await get_all_roles_in_server(db, server_id)
        for role in roles:
            if str(role.id) in [db_role['role_id'] for db_role in db_roles]:
                continue
            else:  # role not in db
                await create_role_in_db(db, server_id, role.id)
                # add role created message to res
                res["roles_created"].append(str(role.id))
        # if role in db but not in discord, delete it from db
        for db_role in db_roles:
            if db_role['role_id'] not in [str(role.id) for role in roles]:
                await handle_discord_role_removed(db, int(db_role['role_id']), server_id)
                # add role deleted message to res
                res["roles_deleted"].append(db_role['role_id'])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync roles: {str(e)}"
        )
    return res


@discord_client.event
@app.get("/discord/server/{server_id}/games")
async def get_games(server_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token)

    try:
        games = await get_games_by_server(db, server_id)
        return games
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get games: {str(e)}"
        )


@discord_client.event
@app.post("/discord/server/{server_id}/games/create")
async def create_game_request(server_id: int, name: str, description: Optional[str] = None, category_id: Optional[int] = None, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await create_game(db, server_id, name, description, category_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create game: {str(e)}"
        )


@discord_client.event
@app.put("/discord/server/{server_id}/games/{game_id}")
async def update_game_request(server_id: int, game_id: int, name: Optional[str] = None, description: Optional[str] = None, category_id: Optional[int] = None, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await update_game(db, game_id, server_id, name, category_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update game: {str(e)}"
        )


@discord_client.event
@app.delete("/discord/server/{server_id}/games/{game_id}")
async def delete_game_request(server_id: int, game_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await delete_game(db, game_id, server_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete game: {str(e)}"
        )


@discord_client.event
@app.post("/discord/server/{server_id}/games/{game_id}/tags/add")
async def add_tag_request(server_id: int, game_id: int, name: str, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await add_tags_to_game(db, game_id, server_id, [name])
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tag: {str(e)}"
        )


@discord_client.event
@app.delete("/discord/server/{server_id}/games/{game_id}/tags/{tag_id}")
async def delete_tag_request(server_id: int, game_id: int, tag_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await remove_tag_from_game(db, game_id, server_id, tag_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tag: {str(e)}"
        )


@discord_client.event
@app.delete("/discord/server/{server_id}/tags/{tag_id}")
async def delete_tag_by_id_request(server_id: int, tag_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await remove_tag_by_id(db, tag_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tag: {str(e)}"
        )


@discord_client.event
@app.post("/discord/server/{server_id}/games/{game_id}/roles/add")
async def map_roles_to_game_request(server_id: int, game_id: int, role_ids: List[str], discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await map_roles_to_game(db, game_id, server_id, role_ids)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to map roles to game: {str(e)}"
        )


@discord_client.event
@app.get("/discord/server/{server_id}/games/{game_id}/roles")
async def get_game_roles_request(server_id: int, game_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await get_game_roles(db, game_id, server_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get game roles: {str(e)}"
        )


@discord_client.event
@app.post("/discord/server/{server_id}/games/{game_id}/categories/create")
async def create_category_request(server_id: int, game_id: int, name: str, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await create_category(db, server_id, name)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create category: {str(e)}"
        )


@discord_client.event
@app.post("/discord/server/{server_id}/games/{game_id}/categories/add")
async def add_category_request(server_id: int, game_id: int, category_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await map_category_to_game(db, game_id, server_id, category_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add category to game: {str(e)}"
        )


@discord_client.event
@app.delete("/discord/server/{server_id}/categories/{category_id}")
async def delete_category_request(server_id: int, game_id: int, category_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token, require_manage_guild=True)

    try:
        res = await delete_category(db, category_id, server_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete category: {str(e)}"
        )


@discord_client.event
@app.get("/discord/server/{server_id}/search/name")
async def search_games_by_name_request(server_id: int, name: str, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token)

    try:
        res = await find_games_by_name(db, server_id, name)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search games by name: {str(e)}"
        )


@discord_client.event
@app.get("/discord/server/{server_id}/search/tags")
async def search_games_by_tags_request(server_id: int, tags: List[str], discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token)

    try:
        res = await find_games_by_tags(db, server_id, tags)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search games by tags: {str(e)}"
        )


@discord_client.event
@app.get("/discord/server/{server_id}/search/categories")
async def search_games_by_categories_request(server_id: int, category: str, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    await authenticate_and_authorize_user(server_id, discord_access_token)

    try:
        res = await find_games_by_category(db, server_id, category)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search games by categories: {str(e)}"
        )
