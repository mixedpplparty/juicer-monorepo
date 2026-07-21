use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

/// Mirror of Hono's HTTPException: a status code plus a plain-text message body
/// (Hono's default onError returns the message as text).
#[derive(Debug, thiserror::Error)]
#[error("{status}: {message}")]
pub struct HttpError {
    pub status: StatusCode,
    pub message: String,
}

impl HttpError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self { status, message: message.into() }
    }
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, message)
    }
    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, message)
    }
    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, message)
    }
    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, message)
    }
}

impl IntoResponse for HttpError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}

impl From<sqlx::Error> for HttpError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!(error = %err, "database error");
        HttpError::internal("Database error.")
    }
}

impl From<serenity::Error> for HttpError {
    fn from(err: serenity::Error) -> Self {
        if let serenity::Error::Http(serenity::http::HttpError::UnsuccessfulRequest(resp)) = &err {
            let status = StatusCode::from_u16(resp.status_code.as_u16())
                .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            return HttpError::new(status, resp.error.message.clone());
        }
        tracing::error!(error = %err, "discord error");
        HttpError::internal("Discord error.")
    }
}

pub type Result<T> = std::result::Result<T, HttpError>;
