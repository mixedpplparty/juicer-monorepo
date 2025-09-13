"""
Security utilities for the Juicer backend application.
"""
import re
import time
from typing import Dict, Optional
from fastapi import HTTPException, Request, status
from collections import defaultdict, deque
import asyncio


class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window approach.
    In production, consider using Redis for distributed rate limiting.
    """

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(lambda: deque())
        self._lock = asyncio.Lock()

    async def is_allowed(self, client_ip: str) -> bool:
        """Check if the client is allowed to make a request."""
        async with self._lock:
            now = time.time()
            client_requests = self.requests[client_ip]

            # Remove old requests outside the window
            while client_requests and client_requests[0] <= now - self.window_seconds:
                client_requests.popleft()

            # Check if under limit
            if len(client_requests) >= self.max_requests:
                return False

            # Add current request
            client_requests.append(now)
            return True


# Global rate limiter instance
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)


async def check_rate_limit(request: Request) -> None:
    """Check rate limit for the request."""
    client_ip = request.client.host if request.client else "unknown"

    if not await rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )


def validate_discord_id(discord_id: str) -> bool:
    """Validate Discord ID format."""
    # Discord IDs are 17-19 digit numbers
    return bool(re.match(r'^\d{17,19}$', discord_id))


def validate_server_id(server_id: int) -> bool:
    """Validate Discord server ID."""
    # Discord server IDs are 17-19 digit numbers
    return 10**16 <= server_id <= 10**19 - 1


def sanitize_string(input_str: str, max_length: int = 100) -> str:
    """Sanitize string input to prevent injection attacks."""
    if not isinstance(input_str, str):
        raise ValueError("Input must be a string")

    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\';\\]', '', input_str)

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_game_name(name: str) -> str:
    """Validate and sanitize game name."""
    if not name or not isinstance(name, str):
        raise ValueError("Game name is required and must be a string")

    if len(name.strip()) < 1:
        raise ValueError("Game name cannot be empty")

    if len(name) > 100:
        raise ValueError("Game name cannot exceed 100 characters")

    return sanitize_string(name, 100)


def validate_tag_name(name: str) -> str:
    """Validate and sanitize tag name."""
    if not name or not isinstance(name, str):
        raise ValueError("Tag name is required and must be a string")

    if len(name.strip()) < 1:
        raise ValueError("Tag name cannot be empty")

    if len(name) > 50:
        raise ValueError("Tag name cannot exceed 50 characters")

    return sanitize_string(name, 50)


def validate_category_name(name: str) -> str:
    """Validate and sanitize category name."""
    if not name or not isinstance(name, str):
        raise ValueError("Category name is required and must be a string")

    if len(name.strip()) < 1:
        raise ValueError("Category name cannot be empty")

    if len(name) > 100:
        raise ValueError("Category name cannot exceed 100 characters")

    return sanitize_string(name, 100)


def validate_description(description: Optional[str]) -> Optional[str]:
    """Validate and sanitize description."""
    if description is None:
        return None

    if not isinstance(description, str):
        raise ValueError("Description must be a string")

    if len(description) > 1000:
        raise ValueError("Description cannot exceed 1000 characters")

    return sanitize_string(description, 1000)


def validate_role_ids(role_ids: list) -> list:
    """Validate list of role IDs."""
    if not isinstance(role_ids, list):
        raise ValueError("Role IDs must be a list")

    validated_ids = []
    for role_id in role_ids:
        if isinstance(role_id, str):
            if not validate_discord_id(role_id):
                raise ValueError(f"Invalid Discord role ID format: {role_id}")
            validated_ids.append(role_id)
        elif isinstance(role_id, int):
            if not validate_server_id(role_id):
                raise ValueError(f"Invalid Discord role ID: {role_id}")
            validated_ids.append(str(role_id))
        else:
            raise ValueError(
                f"Role ID must be string or int, got {type(role_id)}")

    return validated_ids


def validate_tag_ids(tag_ids: list) -> list:
    """Validate list of tag IDs."""
    if not isinstance(tag_ids, list):
        raise ValueError("Tag IDs must be a list")

    validated_ids = []
    for tag_id in tag_ids:
        if not isinstance(tag_id, int) or tag_id <= 0:
            raise ValueError(f"Invalid tag ID: {tag_id}")
        validated_ids.append(tag_id)

    return validated_ids
