//! Global middleware: CORS, CSRF, rate limiting and request tracing.
//!
//! Port of the middleware stack in `../server/src/index.ts` (Hono `cors`,
//! `csrf`, `hono-rate-limiter`, `logger`).

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::header::{self, HeaderName, HeaderValue};
use axum::http::Method;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Router;
use axum_extra::extract::CookieJar;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::config::Config;
use crate::error::HttpError;

/// 250 requests per fixed 60-second window, mirroring the Hono config.
const RATE_LIMIT: u32 = 250;
const RATE_WINDOW: Duration = Duration::from_secs(60);

/// key -> (window start, request count in window). In-house fixed-window
/// counter, equivalent to hono-rate-limiter's default MemoryStore.
static RATE_BUCKETS: LazyLock<Mutex<HashMap<String, (Instant, u32)>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// Wrap the app router with the global middleware stack. Layer order matches
/// the TS `every(cors, csrf, rateLimiter, logger)`: CORS runs outermost, then
/// CSRF, then the rate limiter, then request logging.
pub fn apply(router: Router, config: Arc<Config>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(
            config
                .allowed_origins
                .iter()
                .filter_map(|origin| origin.parse::<HeaderValue>().ok()),
        ))
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([
            header::ACCEPT,
            header::ACCEPT_LANGUAGE,
            header::CONTENT_LANGUAGE,
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            HeaderName::from_static("x-requested-with"),
        ]);

    router
        .layer(TraceLayer::new_for_http())
        .layer(axum::middleware::from_fn(rate_limit_middleware))
        .layer(axum::middleware::from_fn_with_state(
            config.clone(),
            csrf_middleware,
        ))
        .layer(cors)
}

/// CSRF protection. For state-changing methods (anything other than
/// GET/HEAD/OPTIONS) the request is allowed when the browser marks it as
/// same-origin/same-site/none via `Sec-Fetch-Site`, or when the `Origin`
/// header is one of the configured allowed origins. Everything else is 403.
async fn csrf_middleware(
    State(config): State<Arc<Config>>,
    req: Request,
    next: Next,
) -> Response {
    let method = req.method();
    // Hono's csrf middleware only enforces on requests a plain HTML form could
    // produce: form-like (or missing) Content-Type. Anything else (e.g.
    // application/json) already requires script + CORS and passes through.
    let form_like = req
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|ct| {
            let ct = ct.to_ascii_lowercase();
            ct.starts_with("application/x-www-form-urlencoded")
                || ct.starts_with("multipart/form-data")
                || ct.starts_with("text/plain")
        })
        .unwrap_or(true);
    if method != Method::GET && method != Method::HEAD && method != Method::OPTIONS && form_like {
        // TS config: csrf({ secFetchSite: "same-site" }) — only the exact
        // value "same-site" is accepted; everything else falls through to the
        // Origin allowlist.
        let sec_fetch_site_ok = matches!(
            req.headers()
                .get("sec-fetch-site")
                .and_then(|v| v.to_str().ok()),
            Some("same-site")
        );
        let origin_ok = req
            .headers()
            .get(header::ORIGIN)
            .and_then(|v| v.to_str().ok())
            .map(|origin| config.allowed_origins.iter().any(|o| o == origin))
            .unwrap_or(false);
        if !sec_fetch_site_ok && !origin_ok {
            return HttpError::forbidden("Forbidden").into_response();
        }
    }
    next.run(req).await
}

/// Fixed-window rate limiter: 250 requests / 60s per key. The key is the
/// `discord_access_token` cookie, falling back to `x-forwarded-for`, then
/// `x-real-ip`, then the peer socket address — same precedence as the TS
/// `keyGenerator` (with the peer IP as a final fallback).
async fn rate_limit_middleware(req: Request, next: Next) -> Response {
    let jar = CookieJar::from_headers(req.headers());
    let connect_info = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .copied();
    let key = jar
        .get("discord_access_token")
        .map(|c| c.value().to_string())
        .or_else(|| {
            req.headers()
                .get("x-forwarded-for")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
        .or_else(|| {
            req.headers()
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
        .or_else(|| connect_info.map(|ConnectInfo(addr)| addr.ip().to_string()))
        .unwrap_or_else(|| "unknown".to_string());

    let now = Instant::now();
    let (count, reset_in) = {
        let mut buckets = RATE_BUCKETS.lock().unwrap_or_else(|e| e.into_inner());
        // Opportunistically drop expired windows so the map does not grow
        // without bound.
        if buckets.len() > 10_000 {
            buckets.retain(|_, (start, _)| now.duration_since(*start) < RATE_WINDOW);
        }
        let entry = buckets.entry(key).or_insert((now, 0));
        if now.duration_since(entry.0) >= RATE_WINDOW {
            *entry = (now, 0);
        }
        entry.1 += 1;
        let reset_in = RATE_WINDOW.saturating_sub(now.duration_since(entry.0));
        (entry.1, reset_in)
    };

    let remaining = RATE_LIMIT.saturating_sub(count);
    let reset_secs = reset_in.as_secs().max(1);

    let mut response = if count > RATE_LIMIT {
        let mut resp = (
            axum::http::StatusCode::TOO_MANY_REQUESTS,
            "Too many requests, please try again later.",
        )
            .into_response();
        resp.headers_mut().insert(
            header::RETRY_AFTER,
            HeaderValue::from(reset_secs),
        );
        resp
    } else {
        next.run(req).await
    };

    // draft-6 style `RateLimit-*` headers on every response.
    let headers = response.headers_mut();
    headers.insert(
        HeaderName::from_static("ratelimit-limit"),
        HeaderValue::from(RATE_LIMIT),
    );
    headers.insert(
        HeaderName::from_static("ratelimit-remaining"),
        HeaderValue::from(remaining),
    );
    headers.insert(
        HeaderName::from_static("ratelimit-reset"),
        HeaderValue::from(reset_secs),
    );
    if let Ok(policy) =
        HeaderValue::from_str(&format!("{RATE_LIMIT};w={}", RATE_WINDOW.as_secs()))
    {
        headers.insert(HeaderName::from_static("ratelimit-policy"), policy);
    }
    response
}
