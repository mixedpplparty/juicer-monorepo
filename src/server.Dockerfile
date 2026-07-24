# syntax=docker/dockerfile:1
# Rust backend (axum). Build context is ./src/, crate at ./server-rust.
#
# The whole stack is rustls-based (no OpenSSL) and the alpine builder produces
# a fully static musl binary, so the runtime image is `scratch`: nothing but
# the binary and the CA bundle (~a tenth of the previous debian-slim image).
FROM rust:1-alpine AS builder

# musl-dev for ring's C sources; ca-certificates only to copy into the runner.
RUN apk add --no-cache musl-dev ca-certificates

WORKDIR /app

# Build with BuildKit cache mounts for the cargo registry and target dir so
# dependency compilation is reused across builds.
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
