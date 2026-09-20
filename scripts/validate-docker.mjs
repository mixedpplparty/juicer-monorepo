// Run after building juicer-migration-backend:test. The source container is
// ONLY read by pg_dump; all migrations run in disposable containers.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const source = process.argv[2];
if (!source || !/^[a-zA-Z0-9_.-]+$/.test(source)) throw new Error('Usage: node scripts/validate-docker.mjs SOURCE_CONTAINER');
const image = process.argv[3] || 'juicer-migration-backend:test';
const runId = `juicer-migration-verify-${Date.now()}`;
const directory = resolve('.migration-validation', runId);
mkdirSync(directory, { recursive: true });
const snapshot = readFileSync('deploy/snapshot.sql');
function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`Docker ${args[0]} failed (${result.status}): ${result.stderr || result.error || ''}`);
  return result.stdout || '';
}
function snapshotDb(database, before) {
  return docker(['exec','-i',runId,'psql','-X','-qAt','-U','postgres','-d',database,'-v',`normalize_verification=${before}`], { input: snapshot }).trim().split('\n').slice(1).join('\n');
}
function migrate(database, adopt = false) {
  return docker(['run','--rm','--network',runId,'-e',`POSTGRES_HOST=${runId}`,'-e','POSTGRES_USER=postgres','-e',`POSTGRES_DB=${database}`,'-e','POSTGRES_PORT=5432',image,'/juicer-server','migrate',...(adopt ? ['--adopt-legacy'] : [])]);
}
const schemaSql = `
SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,coalesce(pg_get_expr(d.adbin,d.adrelid),'')
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
WHERE n.nspname='public' AND c.relkind='r' AND c.relname<>'_sqlx_migrations' AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attname;
SELECT conrelid::regclass::text,contype,pg_get_constraintdef(oid),convalidated FROM pg_constraint
WHERE connamespace='public'::regnamespace AND conrelid<>'_sqlx_migrations'::regclass ORDER BY 1,2,3;
SELECT t.relname,am.amname,i.indisunique,i.indisvalid,i.indisready,
  (SELECT string_agg(pg_get_indexdef(i.indexrelid,k,true),',' ORDER BY k) FROM generate_series(1,i.indnatts) k),pg_get_expr(i.indpred,i.indrelid)
FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_class idx ON idx.oid=i.indexrelid JOIN pg_am am ON am.oid=idx.relam
WHERE t.relnamespace='public'::regnamespace AND t.relname<>'_sqlx_migrations' ORDER BY 1,2,3,6;
SELECT c.relname,s.seqtypid::regtype,s.seqstart,s.seqincrement,s.seqmax,s.seqmin,s.seqcache,s.seqcycle FROM pg_sequence s
JOIN pg_class c ON c.oid=s.seqrelid WHERE c.relnamespace='public'::regnamespace ORDER BY c.relname;
`;
let networkCreated = false;
let containerCreated = false;
try {
  // Use file descriptors so Windows cannot decode/corrupt the binary dump.
  const dumpPath = join(directory, 'source.dump');
  const dumpFd = openSync(dumpPath, 'wx', 0o600);
  try {
    docker(['exec',source,'sh','-c','exec pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT"'], { stdio: ['ignore',dumpFd,'pipe'] });
  } finally { closeSync(dumpFd); }
  docker(['network','create',runId]); networkCreated = true;
  docker(['run','-d','--rm','--name',runId,'--network',runId,'--label','juicer.purpose=migration-validation','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17.10-alpine@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193']); containerCreated = true;
  let ready = false;
  for (let i=0;i<60;i++) {
    const check = spawnSync('docker',['exec',runId,'pg_isready','-h','127.0.0.1','-U','postgres'], { stdio:'ignore' });
    if (check.status===0) { ready=true; break; }
    await new Promise(resolve => setTimeout(resolve,1000));
  }
  assert.ok(ready,'disposable database ready');
  docker(['exec',runId,'createdb','-U','postgres','upgraded']);
  const inputFd = openSync(dumpPath,'r');
  try { docker(['exec','-i',runId,'pg_restore','-U','postgres','-d','upgraded','--exit-on-error','--no-owner','--no-acl'],{stdio:[inputFd,'pipe','pipe']}); }
  finally { closeSync(inputFd); }
  const before = snapshotDb('upgraded',true);
  migrate('upgraded',true);
  const after = snapshotDb('upgraded',false);
  assert.equal(after,before,'restored data, sequence values and Drizzle history are preserved');
  migrate('upgraded');
  assert.equal(snapshotDb('upgraded',false),after,'repeated migration is a no-op');
  docker(['exec',runId,'createdb','-U','postgres','fresh']);
  migrate('fresh');
  // A later deployment must not expect the historical backfill to run again
  // for records created after version 2 was already recorded.
  docker(['exec',runId,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','fresh','-c',"INSERT INTO servers(server_id) VALUES ('post-migration'); INSERT INTO roles_categories(server_id,name) VALUES ('post-migration','verification')"]);
  assert.equal(snapshotDb('fresh',true),snapshotDb('fresh',false),'completed backfill is not expected again on later deployments');
  const schema = database => docker(['exec','-i',runId,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d',database],{input:schemaSql});
  assert.equal(schema('upgraded'),schema('fresh'),'fresh and upgraded application schemas agree');
  writeFileSync(join(directory,'fingerprints.txt'),after+'\n');
  writeFileSync(join(directory,'result.json'),JSON.stringify({source,image,backup:dumpPath,freshSetup:true,legacyUpgrade:true,dataAndSequencesPreserved:true,repeatSafe:true,schemaEquivalent:true},null,2)+'\n');
  console.log(`PASS: fresh setup, restored upgrade, fingerprints, repeat safety, schema equivalence. Evidence: ${directory}`);
} finally {
  if (containerCreated) docker(['rm','-fv',runId]);
  if (networkCreated) docker(['network','rm',runId]);
}
