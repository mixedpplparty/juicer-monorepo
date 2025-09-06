from api import exchange_code_async, refresh_token_async, revoke_token_async
import discord
import asyncio
import requests
import aiohttp
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from typing import Union
import os
import sys
from fastapi import Response
from fastapi import Cookie, HTTPException, status
from typing import Optional

file_dir = os.path.dirname(__file__)
sys.path.append(file_dir)

# load .env
load_dotenv()
REDIRECT_AFTER_SIGN_IN_URI = os.environ.get('REDIRECT_AFTER_SIGN_IN_URI')
REDIRECT_AFTER_SIGN_IN_FAILED_URI = os.environ.get('REDIRECT_AFTER_SIGN_IN_FAILED_URI')


app = FastAPI()
# allowed origins(cors)
origins = [
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # for cookie ping-pong
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


# USER OAuth Endpoints


# @app.get("/discord/auth/callback")
# async def discord_callback(code: str):
#     try:
#         # redirect to POST REDIRECT_AFTER_SIGN_IN_URI with code
#         token = await exchange_code_async(code)
#         return RedirectResponse(url=f"{REDIRECT_AFTER_SIGN_IN_URI}?token={token}", status_code=302)
#     except Exception as e:
#         return {"error": str(e)}

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


@app.get("/discord/auth/remove_cookies")
async def discord_remove_cookies(response: Response):
    response.delete_cookie("discord_access_token")
    response.delete_cookie("discord_refresh_token")
    return {"message": "Cookies removed"}
