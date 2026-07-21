# syntax=docker/dockerfile:1
# Rust backend (axum). Build context is ./src/, crate at ./server-rust.
FROM rust:1-slim-bookworm AS builder

WORKDIR /app

# Build with BuildKit cache mounts for the cargo registry and target dir so
# dependency compilation is reused across builds.
COPY server-rust ./server-rust
RUN --mount=type=cache,id=cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=cargo-target,target=/app/server-rust/target \
    cargo build --release --manifest-path server-rust/Cargo.toml \
    && cp server-rust/target/release/juicer-server /app/juicer-server

FROM debian:bookworm-slim AS runner

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 appgroup \
    && useradd --system --uid 1001 --gid appgroup appuser

COPY --from=builder --chown=appuser:appgroup /app/juicer-server /app/juicer-server

USER appuser
EXPOSE 8000

CMD ["/app/juicer-server"]
