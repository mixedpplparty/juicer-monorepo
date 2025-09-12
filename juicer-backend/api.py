import aiohttp
import asyncio
import requests
from dotenv import load_dotenv
import os
from fastapi import Cookie, HTTPException, status

# auth then redirect to callback

# load .env
load_dotenv()
CLIENT_ID = os.environ.get('VITE_CLIENT_ID')
CLIENT_SECRET = os.environ.get('VITE_CLIENT_SECRET')
REDIRECT_URI = os.environ.get('REDIRECT_URI')
API_ENDPOINT = os.environ.get('VITE_API_ENDPOINT')


async def exchange_code_async(code: str) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_ENDPOINT}/oauth2/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
            ) as response:
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientError as e:
        print(f"HTTP client error: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise


def exchange_code(code):
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    r = requests.post('%s/oauth2/token' % API_ENDPOINT, data=data,
                      headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))
    r.raise_for_status()
    return r.json()

# {"token_type":"Bearer","access_token":"REDACTED","expires_in":604800,"refresh_token":"REDACTED","scope":"identify"}

# another fresh token given with refresh token


async def refresh_token_async(refresh_token: str) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_ENDPOINT}/oauth2/token",
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
            ) as response:
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientError as e:
        print(f"HTTP client error: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise


async def revoke_token_async(token: str) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_ENDPOINT}/oauth2/token/revoke",
                data={
                    'token': token,
                    'token_type_hint': 'access_token'
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
            ) as response:
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientError as e:
        print(f"HTTP client error: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise


async def discord_user_get_data(access_token: str) -> dict:
    """
    Fetches Discord user data from the Discord API using the provided access token.

    Args:
        access_token (str): The Discord access token

    Returns:
        dict: The user data JSON response from Discord API

    Raises:
        aiohttp.ClientError: If there's an HTTP client error
        Exception: If there's an unexpected error
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://discordapp.com/api/users/@me",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            ) as response:
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientResponseError as e:
        if e.status == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated. Invalid access token.",
            )
    except aiohttp.ClientError as e:
        print(f"HTTP client error: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise
