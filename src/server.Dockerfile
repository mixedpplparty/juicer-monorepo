# syntax=docker/dockerfile:1
# Rust backend (axum). Build context is ./src/, crate at ./server-rust.
#
# The whole stack is rustls-based (no OpenSSL) and the alpine builder produces
# a fully static musl binary, so the runtime image is `scratch`: nothing but
# the binary and the CA bundle (~a tenth of the previous debian-slim image).
#
# Pinned toolchain for reproducible builds (bump deliberately when needed).
FROM rust:1.88-alpine AS builder

# musl-dev for ring's C sources; ca-certificates only to copy into the runner.
RUN apk add --no-cache musl-dev ca-certificates

WORKDIR /app

# --- Dependency pre-compilation layer (cached across source-only changes) ---
# Copy ONLY the manifests + lockfile first, then build every dependency against
# a stub binary. As long as Cargo.toml/Cargo.lock are unchanged, this layer is
# reused and only the final crate recompiles when source edits land.
COPY server-rust/Cargo.toml server-rust/Cargo.lock ./server-rust/
RUN mkdir -p server-rust/src \
    && printf 'fn main() {}\n' > server-rust/src/main.rs \
    && cargo build --release --manifest-path server-rust/Cargo.toml --bins \
    && rm -rf server-rust/src

# --- Real build (fast: deps come from the cached layer above) ---
COPY server-rust ./server-rust
RUN cargo build --release --manifest-path server-rust/Cargo.toml \
    && cp server-rust/target/release/juicer-server /app/juicer-server

FROM scratch AS runner

# TLS roots are compiled in via webpki-roots; the system bundle is included
# anyway so a future switch to native certs cannot fail silently.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /app/juicer-server /juicer-server

USER 1001:1001
EXPOSE 8000

CMD ["/juicer-server"]
