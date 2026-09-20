#!/usr/bin/env bash
# Run the copy shipped WITH the release. No git pull and no floating app tags.
set -Eeuo pipefail
umask 077

root=$(realpath "${1:?Usage: deploy.sh APP_DIRECTORY COMMIT_SHA [--initialize]}")
release=${2:?A full commit SHA is required}
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA' >&2; exit 1; }
initialize=${3:-}
[[ -z "$initialize" || "$initialize" == --initialize ]] || exit 2
assets=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -f "$root/.env" ]] || { echo 'Missing host-managed .env' >&2; exit 1; }
exec 9>"$root/.deploy.lock"
flock -w 600 9 || { echo 'Another deployment is running' >&2; exit 1; }
build_number=${JUICER_BUILD_NUMBER:-}
if [[ -n "$build_number" ]]; then
    [[ "$build_number" =~ ^[0-9]+$ ]] || exit 2
    if [[ -f "$root/current-build-number" ]]; then
        previous_build=$(cat "$root/current-build-number")
        [[ "$previous_build" =~ ^[0-9]+$ ]] || exit 2
        if (( build_number < previous_build )); then
            echo 'A newer pipeline already deployed; skipping this stale release.'
            exit 0
        fi
    fi
fi

db_container=juicer-db
verify_container=
verify_network=
cleanup() {
    # Only disposable resources created by this invocation are removed.
    if [[ -n "$verify_container" ]]; then docker rm -fv "$verify_container" >/dev/null 2>&1 || true; fi
    if [[ -n "$verify_network" ]]; then docker network rm "$verify_network" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT
trap 'echo "Deployment failed. Backups and the existing database volume are retained; do not run down -v or automatically reverse migrations." >&2' ERR

if docker inspect "$db_container" >/dev/null 2>&1; then
    [[ -z "$initialize" ]] || { echo '--initialize is forbidden when a database container exists' >&2; exit 1; }
    project=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$db_container")
    mount=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Type}} {{.Name}}{{end}}{{end}}' "$db_container")
    [[ "$mount" == volume\ * ]] || { echo 'Expected an existing named PostgreSQL volume' >&2; exit 1; }
    volume=${mount#volume }
    docker volume inspect "$volume" >/dev/null
    major=$(docker exec "$db_container" sh -c 'cat "$PGDATA/PG_VERSION"')
    [[ "$major" == 17 ]] || { echo 'Expected PostgreSQL 17; major upgrades require a separate procedure' >&2; exit 1; }
else
    [[ "$initialize" == --initialize ]] || { echo 'Database container missing. Refusing to create an empty replacement. Recover the existing container/volume, or explicitly initialize a NEW installation.' >&2; exit 1; }
    project=juicer
    volume=juicer_postgres_data
    if docker volume inspect "$volume" >/dev/null 2>&1; then
        echo 'A database volume already exists; refusing initialization. Recover the existing installation.' >&2
        exit 1
    fi
fi
[[ "$project" =~ ^[a-z0-9][a-z0-9_-]*$ && "$volume" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || exit 1

export JUICER_RELEASE="$release" POSTGRES_VOLUME_NAME="$volume" JUICER_ENV_FILE="$root/.env"
compose=(docker compose --project-name "$project" --env-file "$root/.env" -f "$assets/docker-compose.yml")
"${compose[@]}" config --quiet
if [[ -z "$initialize" ]]; then
    # Compare without printing credentials. Changing database identity in this
    # release could otherwise point the migrator at a different database.
    previous_environment=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$db_container")
    next_environment=$("${compose[@]}" config --environment)
    for key in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD POSTGRES_PORT; do
        old_value=$(printf '%s\n' "$previous_environment" | sed -n "s/^$key=//p")
        new_value=$(printf '%s\n' "$next_environment" | sed -n "s/^$key=//p")
        if [[ "$key" == POSTGRES_PORT ]]; then new_value=${new_value:-5432}; fi
        [[ "$old_value" == "$new_value" ]] || { echo "$key must not change during this upgrade" >&2; exit 1; }
    done
    unset previous_environment next_environment old_value new_value
fi
"${compose[@]}" --profile tools pull
backend_image="192.168.1.101:5000/kuukan-app/juicer-backend:$release"
postgres_image='postgres:17.10-alpine@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193'

if [[ -z "$initialize" ]]; then
    # Preflight is read-only and deliberately precedes stopping application writes.
    docker exec "$db_container" sh -c 'exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" -c "SELECT 1"' >/dev/null
    mkdir -p "$root/backups"
    backup_dir=$(mktemp -d "$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$release-XXXXXX")
    if [[ -f "$root/current-release" ]]; then cp "$root/current-release" "$backup_dir/previous-release"; fi
    if [[ -f "$root/docker-compose.yml" ]]; then cp "$root/docker-compose.yml" "$backup_dir/previous-compose.yml"; fi
    # Stop the current writers before the backup; leave them stopped on failure
    # until the operator chooses retry or application rollback.
    for service in frontend backend; do
        ids=$(docker ps -q --filter "label=com.docker.compose.project=$project" --filter "label=com.docker.compose.service=$service")
        if [[ -n "$ids" ]]; then
            docker inspect -f '{{.Name}} {{.Image}} {{.Config.Image}}' $ids >> "$backup_dir/previous-app-images.txt"
            docker stop $ids >/dev/null
        fi
    done
    docker exec "$db_container" sh -c 'exec pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT"' > "$backup_dir/database.dump.partial"
    test -s "$backup_dir/database.dump.partial"
    mv "$backup_dir/database.dump.partial" "$backup_dir/database.dump"
    docker inspect -f '{{.Image}}' "$db_container" > "$backup_dir/previous-db-image.txt"
    printf '%s\n' "$project" "$volume" > "$backup_dir/database-location.txt"

    # Restore and exercise THIS release against the backup before touching the
    # original volume. No published ports; isolated network; synthetic auth.
    name="juicer-restore-${release:0:12}-$$"
    docker network create "$name" >/dev/null
    verify_network=$name
    docker run -d --rm --name "$name" --network "$name" -e POSTGRES_HOST_AUTH_METHOD=trust "$postgres_image" >/dev/null
    verify_container=$name
    ready=false
    for ((attempt=0; attempt<60; attempt++)); do
        if docker exec "$name" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then ready=true; break; fi
        sleep 1
    done
    "$ready" || { echo 'Restore database did not become ready' >&2; exit 1; }
    docker exec -i "$name" pg_restore -U postgres -d postgres --exit-on-error --no-owner --no-acl < "$backup_dir/database.dump"
    docker exec -i "$name" psql -X -qAt -U postgres -v normalize_verification=true < "$assets/snapshot.sql" | tail -n +2 > "$backup_dir/before.txt"
    docker run --rm --network "$name" -e POSTGRES_HOST="$name" -e POSTGRES_PORT=5432 -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres "$backend_image" /juicer-server migrate --adopt-legacy
    docker exec -i "$name" psql -X -qAt -U postgres -v normalize_verification=false < "$assets/snapshot.sql" | tail -n +2 > "$backup_dir/after.txt"
    cmp "$backup_dir/before.txt" "$backup_dir/after.txt"
    docker run --rm --network "$name" -e POSTGRES_HOST="$name" -e POSTGRES_PORT=5432 -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres "$backend_image" /juicer-server check-db
    cleanup
    verify_container= verify_network=
fi

# Compose is explicitly pinned to the previously discovered EXTERNAL volume.
# Keep the project identity, database name/user/password, port and PG major.
if [[ "$initialize" == --initialize ]]; then docker volume create "$volume" >/dev/null; fi
"${compose[@]}" up -d --wait --wait-timeout 120 db
actual_volume=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' "$db_container")
[[ "$actual_volume" == "$volume" ]] || { echo 'Database volume mismatch' >&2; exit 1; }
"${compose[@]}" run --rm --no-deps migrate /juicer-server migrate --adopt-legacy
"${compose[@]}" run --rm --no-deps migrate /juicer-server check-db
"${compose[@]}" up -d --no-deps --wait --wait-timeout 120 backend
"${compose[@]}" up -d --no-deps --wait --wait-timeout 120 frontend
printf '%s\n' "$release" > "$root/current-release"
if [[ -n "$build_number" ]]; then printf '%s\n' "$build_number" > "$root/current-build-number"; fi
printf 'Deployment %s ready; database volume %s retained.\n' "$release" "$volume"
