import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'juicer-compose-check-'));
const envFile = join(directory, '.env');
writeFileSync(envFile, 'POSTGRES_DB=test\nPOSTGRES_USER=test\nPOSTGRES_PASSWORD=test-only\nPOSTGRES_PORT=5432\n');
const env = { ...process.env, JUICER_RELEASE: 'a'.repeat(40), JUICER_ENV_FILE: envFile, POSTGRES_VOLUME_NAME: 'existing-test-volume' };
try {
  for (const file of ['docker-compose.yml', 'docker-compose-dev.yml', 'docker-compose-dev-server-debug.yml', 'deploy/docker-compose.yml']) {
    const result = spawnSync('docker', ['compose', '--profile', 'tools', '--env-file', envFile, '-f', file, 'config', '--no-env-resolution', '--format', 'json'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(result.stdout);
    assert.ok(config.services.db.image.startsWith('postgres:17.10-alpine@sha256:'));
    assert.equal(config.services.db.volumes[0].target, '/var/lib/postgresql/data');
    assert.deepEqual(config.services.migrate.command, ['/juicer-server', 'migrate']);
    assert.equal(config.services.backend.environment.POSTGRES_HOST, 'db');
    if (file.startsWith('deploy/')) {
      assert.equal(config.volumes.postgres_data.external, true);
      assert.equal(config.volumes.postgres_data.name, 'existing-test-volume');
      assert.equal(config.services.backend.image, config.services.migrate.image);
      assert.ok(config.services.backend.image.endsWith(env.JUICER_RELEASE));
    } else {
      assert.equal(config.services.backend.depends_on.migrate.condition, 'service_completed_successfully');
    }
    console.log(`${file}: valid, migration ordering and volume retention checked`);
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
