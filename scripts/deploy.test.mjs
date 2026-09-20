import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

for (const mode of ['success','missing','identity-change','backup-failure','restore-failure','clone-migration-failure','data-change','migration-failure','readiness-failure']) {
  test(`deployment ${mode}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'juicer-deployment-test-'));
    try {
      const log = join(root, 'docker.log');
      writeFileSync(join(root, '.env'), 'POSTGRES_DB=test\n');
      copyFileSync('scripts/fixtures/docker', join(root, 'docker'));
      chmodSync(join(root, 'docker'), 0o700);
      const result = spawnSync('bash', [resolve('deploy/deploy.sh'), root, 'a'.repeat(40)], {
        encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}`, DOCKER_TEST_LOG: log, DOCKER_TEST_MODE: mode },
      });
      const calls = readFileSync(log, 'utf8');
      assert.equal(result.status === 0, mode === 'success', result.stderr);
      assert.equal(existsSync(join(root, 'current-release')), mode === 'success');
      assert.ok(!/down|volume rm|volume create/.test(calls), 'existing database must never be deleted or replaced');
      const actualMigration = calls.indexOf('run --rm --no-deps migrate /juicer-server migrate --adopt-legacy');
      if (['missing','identity-change','backup-failure','restore-failure','clone-migration-failure','data-change'].includes(mode)) {
        assert.equal(actualMigration, -1, 'preflight failure must prevent real migration');
        assert.ok(!calls.includes('up -d --wait'), 'preflight failure must prevent database replacement');
      }
      if (mode === 'migration-failure') assert.ok(!calls.includes('up -d --no-deps'), 'migration failure must prevent app rollout');
      if (mode === 'readiness-failure') assert.ok(!calls.includes('120 frontend'), 'backend failure must prevent frontend rollout');
      if (mode === 'success') {
        assert.ok(calls.indexOf('pg_dump -Fc') < calls.indexOf('pg_restore'));
        assert.ok(calls.indexOf('normalize_verification=false') < actualMigration);
        assert.ok(actualMigration < calls.indexOf('120 backend'));
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}

for (const mode of ['initialize', 'initialize-existing-volume', 'initialize-pull-failure']) {
  test(`new production deployment ${mode}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'juicer-initialize-test-'));
    try {
      const log = join(root, 'docker.log');
      writeFileSync(join(root, '.env'), 'POSTGRES_DB=test\n');
      copyFileSync('scripts/fixtures/docker', join(root, 'docker'));
      chmodSync(join(root, 'docker'), 0o700);
      const result = spawnSync('bash', [resolve('deploy/deploy.sh'), root, 'a'.repeat(40), '--initialize'], {
        encoding: 'utf8', env: { ...process.env, PATH: `${root}:${process.env.PATH}`, DOCKER_TEST_LOG: log, DOCKER_TEST_MODE: mode },
      });
      const calls = readFileSync(log, 'utf8');
      assert.equal(result.status === 0, mode === 'initialize', result.stderr);
      assert.equal(existsSync(join(root, 'current-release')), mode === 'initialize');
      assert.ok(!calls.includes('pg_dump'), 'new installation has no existing database to back up');
      if (mode === 'initialize') {
        assert.ok(calls.indexOf('--profile tools pull') < calls.indexOf('volume create juicer_postgres_data'));
        assert.ok(calls.indexOf('volume create juicer_postgres_data') < calls.indexOf('up -d --wait'));
        assert.ok(calls.indexOf('migrate --adopt-legacy') < calls.indexOf('120 backend'));
      } else {
        assert.ok(!calls.includes('volume create'), 'preflight failure must not create a database volume');
        assert.ok(!calls.includes('up -d'), 'preflight failure must not start services');
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}

test('older pipeline cannot replace a newer deployment', () => {
  const root=mkdtempSync(join(tmpdir(),'juicer-stale-release-'));
  try {
    writeFileSync(join(root,'.env'),'POSTGRES_DB=test\n');
    writeFileSync(join(root,'current-build-number'),'20\n');
    copyFileSync('scripts/fixtures/docker',join(root,'docker'));
    chmodSync(join(root,'docker'),0o700);
    const log=join(root,'docker.log');
    const result=spawnSync('bash',[resolve('deploy/deploy.sh'),root,'a'.repeat(40)],{
      encoding:'utf8',env:{...process.env,PATH:`${root}:${process.env.PATH}`,JUICER_BUILD_NUMBER:'19',DOCKER_TEST_LOG:log,DOCKER_TEST_MODE:'success'},
    });
    assert.equal(result.status,0,result.stderr);
    assert.ok(result.stdout.includes('stale release'));
    assert.ok(!existsSync(log),'stale release must not touch Docker');
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('host lock serializes simultaneous deployments', async () => {
  const root=mkdtempSync(join(tmpdir(),'juicer-deploy-lock-'));
  try {
    writeFileSync(join(root,'.env'),'POSTGRES_DB=test\n');
    copyFileSync('scripts/fixtures/docker',join(root,'docker'));
    chmodSync(join(root,'docker'),0o700);
    const log=join(root,'docker.log');
    const run=() => new Promise((resolvePromise,reject) => {
      const child=spawn('bash',[resolve('deploy/deploy.sh'),root,'a'.repeat(40)],{
        env:{...process.env,PATH:`${root}:${process.env.PATH}`,DOCKER_TEST_LOG:log,DOCKER_TEST_MODE:'success'},stdio:'pipe',
      });
      let error='';child.stderr.on('data',data=>error+=data);
      child.on('error',reject);child.on('close',code=>code===0?resolvePromise():reject(new Error(error)));
    });
    await Promise.all([run(),run()]);
    const calls=readFileSync(log,'utf8');
    const secondStart=calls.indexOf('inspect juicer-db',calls.indexOf('inspect juicer-db')+1);
    assert.ok(secondStart>calls.indexOf('120 frontend'),'second deployment must wait until first rollout completes');
  } finally { rmSync(root,{recursive:true,force:true}); }
});
