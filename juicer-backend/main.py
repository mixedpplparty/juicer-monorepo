from api import exchange_code_async, refresh_token_async, revoke_token_async, discord_user_get_data
import discord
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from typing import Union
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
async def read_current_user(discord_access_token: Optional[str] = Cookie(None), discord_refresh_token: Optional[str] = Cookie(None)):
    """
    Fetches the current user's data based on the access_token cookie.
    """
    if discord_access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. No access token found in cookies.",
        )

    return {"discord_access_token": discord_access_token, "discord_refresh_token": discord_refresh_token if discord_refresh_token else None}


@app.post("/discord/auth/refresh")
async def discord_refresh(refresh_token: str):
    try:
        return await refresh_token_async(refresh_token)
    except Exception as e:
        return {"error": str(e)}


@app.post("/discord/auth/revoke")
async def discord_revoke(token: str, response: Response):
    try:
        return await revoke_token_async(token)
    except Exception as e:
        return {"error": str(e)}


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

# server that both the user requested and the bot is in


@discord_client.event
@app.get("/discord/user/{member_id}")
async def get_db_member_data(member_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    # auth check
    try:
        user_data = await discord_user_get_data(discord_access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated."
        )
    try:
        user = await discord_client.fetch_user(int(member_id))
    except discord.errors.NotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    guilds = user.mutual_guilds
    res = []
    for guild in guilds:
        res.append({
            "id": guild.id,
            "name": guild.name,
            "icon": guild.icon,
            "owner": guild.owner_id,
            "member_count": guild.member_count,
        })
    return res


@discord_client.event
@app.get("/discord/server/{server_id}")
async def get_db_server_data(server_id: int, discord_access_token: Optional[str] = Cookie(None), db: AsyncGenerator[any, any] = Depends(get_db)):
    # auth check
    try:
        user_data = await discord_user_get_data(discord_access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated."
        )

    # check if bot is in that server and user is in that server
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

    # determine if user has manage server permission
    if not guild.get_member(int(user_data.get("id"))).guild_permissions.manage_guild:
        # admin
        pass
    else:
        # user
        pass

    try:
        async with db.cursor() as cursor:
            await cursor.execute(f"SELECT * FROM servers WHERE server_id = {server_id}")
            result = await cursor.fetchone()
            # if fetchone is None, raise 404
            if result is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Server not found."
                )
            return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch server data: {str(e)}"
        )
