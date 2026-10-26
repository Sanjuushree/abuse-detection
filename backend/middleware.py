import time
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from .database import SessionLocal
from .models import RequestLog
from .engine import DetectionEngine

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Skip logging for preflight OPTIONS requests, docs, and openapi schema to keep analytics clean
        path = request.url.path
        if request.method == "OPTIONS" or path in ("/docs", "/redoc", "/openapi.json", "/favicon.ico"):
            return await call_next(request)

        # Extract client IP safely
        client_ip = request.client.host if request.client else "127.0.0.1"
        # Respect X-Forwarded-For if behind a proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Capture response
        try:
            response: Response = await call_next(request)
            status_code = response.status_code
        except Exception:
            status_code = 500
            raise
        finally:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            user_agent = request.headers.get("user-agent", "")[:500]

            # We log API requests (avoid logging the internal log fetcher repeatedly if desired, but we can log all /api routes)
            # To prevent infinite recursion when dashboard fetches logs, don't trigger detection on read-only analytics queries
            is_analytics_read = path.startswith(("/api/dashboard", "/api/traffic", "/api/threats", "/api/health", "/api/reports", "/api/settings", "/api/ml", "/api/ip-analysis", "/api/endpoints")) and request.method == "GET"

            db = SessionLocal()
            try:
                # Never log sensitive query params or passwords
                safe_endpoint = path
                
                log = RequestLog(
                    timestamp=datetime.now(timezone.utc),
                    endpoint=safe_endpoint,
                    method=request.method,
                    client_ip=client_ip,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    user_agent=user_agent,
                    request_size=int(request.headers.get("content-length", 0))
                )
                db.add(log)
                db.commit()
                db.refresh(log)

                # Trigger detection engine for operational and monitored endpoints
                if not is_analytics_read:
                    DetectionEngine.evaluate_request(db, log)
            except Exception as e:
                db.rollback()
                print(f"[Middleware Error] Logging failed: {e}")
            finally:
                db.close()

        return response
