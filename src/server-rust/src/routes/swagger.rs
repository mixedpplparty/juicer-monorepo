//! Port of ../server/src/routes/swagger.ts — serves the hand-written OpenAPI
//! document at GET / (mounted at /swagger) plus a minimal swagger-ui page for
//! GET /docs via `docs_router()`.

use axum::{
    http::header,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};

use crate::state::AppState;

/// The OpenAPI document, ported verbatim from the TS backend.
const OPENAPI_JSON: &str = include_str!("../../openapi.json");

/// Minimal swagger-ui page (unpkg swagger-ui-dist) pointing at /swagger.
const DOCS_HTML: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>juicer API docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "/swagger",
        dom_id: "#swagger-ui",
      });
    };
  </script>
</body>
</html>
"##;

async fn openapi_doc() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "application/json; charset=utf-8")],
        OPENAPI_JSON,
    )
}

async fn docs_page() -> Html<&'static str> {
    Html(DOCS_HTML)
}

/// GET / — the OpenAPI JSON document (mounted at /swagger).
pub fn router() -> Router<AppState> {
    Router::new().route("/", get(openapi_doc))
}

/// GET / — minimal swagger-ui HTML page (mounted at /docs).
pub fn docs_router() -> Router<AppState> {
    Router::new().route("/", get(docs_page))
}
