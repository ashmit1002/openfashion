import time
import logging
from fastapi import Request, HTTPException
from typing import Dict, Tuple
import redis
from app.config.settings import settings
import os

logger = logging.getLogger(__name__)

# In-memory store for rate limiting (use Redis in production)
rate_limit_store: Dict[str, Tuple[int, float]] = {}

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.redis_client = None
        
        # Try to connect to Redis if available
        try:
            self.redis_client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=0,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("✅ Redis connected for rate limiting")
        except Exception as e:
            logger.warning(f"⚠️ Redis not available, using in-memory rate limiting: {e}")
    
    def is_rate_limited(self, key: str) -> bool:
        """Check if a key is rate limited"""
        current_time = time.time()
        window_start = current_time - 60  # 1 minute window
        
        if self.redis_client:
            # Use Redis for rate limiting
            try:
                # Get current count for this key
                count = self.redis_client.get(f"rate_limit:{key}")
                if count is None:
                    # First request in this window
                    self.redis_client.setex(f"rate_limit:{key}", 60, 1)
                    return False
                
                count = int(count)
                if count >= self.requests_per_minute:
                    return True
                
                # Increment count
                self.redis_client.incr(f"rate_limit:{key}")
                return False
            except Exception as e:
                logger.error(f"Redis rate limiting error: {e}")
                # Fallback to in-memory
                pass
        
        # In-memory rate limiting (fallback)
        if key in rate_limit_store:
            count, timestamp = rate_limit_store[key]
            if current_time - timestamp < 60:  # Within 1 minute window
                if count >= self.requests_per_minute:
                    return True
                rate_limit_store[key] = (count + 1, timestamp)
            else:
                # New window
                rate_limit_store[key] = (1, current_time)
        else:
            # First request
            rate_limit_store[key] = (1, current_time)
        
        return False

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    # Get client identifier (IP address or user ID)
    client_id = request.client.host
    
    # Skip rate limiting for certain endpoints
    if request.url.path.startswith("/api/auth/login") or request.url.path.startswith("/api/auth/register"):
        # Allow more requests for auth endpoints
        auth_limiter = RateLimiter(requests_per_minute=10)
        if auth_limiter.is_rate_limited(f"auth:{client_id}"):
            raise HTTPException(status_code=429, detail="Too many authentication attempts. Please try again later.")
    else:
        # Standard rate limiting for other endpoints
        if rate_limiter.is_rate_limited(client_id):
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    response = await call_next(request)
    return response 