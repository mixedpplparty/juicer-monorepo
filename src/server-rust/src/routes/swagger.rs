//! OpenAPI document generated with utoipa from the route annotations, served
//! at GET /swagger, plus a minimal swagger-ui page at GET /docs.
//!
//! Both routers are mounted only when `Config::docs_enabled()` allows it
//! (hidden in production unless ENABLE_API_DOCS=true) — see `routes::router`.

use std::sync::LazyLock;

use axum::{
    http::header,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa::{Modify, OpenApi};

use crate::state::AppState;

/// Registers the `discord_cookie` security scheme the path annotations refer to.
struct CookieSecurity;

impl Modify for CookieSecurity {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "discord_cookie",
            SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new("discord_access_token"))),
        );
    }
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "juicer API",
        description = "Discord server topic/role management backend. \
                       Authentication uses the `discord_access_token` cookie \
                       set by the OAuth callback."
    ),
    modifiers(&CookieSecurity),
    paths(
        crate::routes::auth::me,
        crate::routes::auth::callback,
        crate::routes::auth::refresh,
        crate::routes::auth::revoke,
        crate::routes::auth::remove_cookies,
        crate::routes::user::me,
        crate::routes::server::get_server_data,
        crate::routes::server::create_server,
        crate::routes::server::get_my_data_in_server,
        crate::routes::server::sync_roles,
        crate::routes::server::update_server,
        crate::routes::games::get_game_details,
        crate::routes::games::create_game,
        crate::routes::games::update_game,
        crate::routes::games::delete_game,
        crate::routes::games::add_category_to_game,
        crate::routes::games::tag_game,
        crate::routes::games::untag_game,
        crate::routes::games::update_thumbnail,
        crate::routes::games::get_thumbnail,
        crate::routes::roles::get_all_roles,
        crate::routes::roles::update_role_settings,
        crate::routes::roles::assign_role,
        crate::routes::roles::unassign_role,
        crate::routes::roles::update_role,
        crate::routes::role_categories::create_role_category,
        crate::routes::role_categories::delete_role_category,
        crate::routes::role_categories::assign_role_category,
        crate::routes::categories::create_category,
        crate::routes::categories::delete_category,
        crate::routes::tags::get_tags,
        crate::routes::tags::create_tag,
        crate::routes::tags::delete_tag,
        crate::routes::search::search_all,
    )
)]
struct ApiDoc;

/// Serialized once — the document is static for the process lifetime.
static OPENAPI_JSON: LazyLock<String> = LazyLock::new(|| {
    ApiDoc::openapi()
        .to_json()
        .expect("OpenAPI document serialization cannot fail")
});

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
        OPENAPI_JSON.as_str(),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn openapi_document_covers_routes_and_security() {
        let json = &*OPENAPI_JSON;
        for fragment in [
            "\"/discord/servers/{serverId}/games/{gameId}\"",
            "\"/discord/servers/{serverId}/search/all\"",
            "\"/discord/auth/callback\"",
            "\"discord_cookie\"",
            "\"UpdateRoleSettingsRequest\"",
            "\"TopicDetails\"",
        ] {
            assert!(json.contains(fragment), "missing {fragment}");
        }
    }
}
