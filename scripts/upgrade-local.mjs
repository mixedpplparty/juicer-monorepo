// Explicit local upgrade. Stops application writers, validates a restored backup,
// then updates the SAME Compose project and volume. Run from the repository root.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const file=process.argv[2] || 'docker-compose-dev-server-debug.yml';
const source='juicer_db';
function docker(args) {
  const result=spawnSync('docker',args,{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);
  return result.stdout;
}
const previous=JSON.parse(docker(['inspect',source]))[0];
const project=previous.Config.Labels['com.docker.compose.project'];
assert.ok(project,'existing Compose project is required');
const mount=previous.Mounts.find(item=>item.Destination==='/var/lib/postgresql/data');
assert.equal(mount?.Type,'volume','a named database volume is required');
const compose=['compose','-p',project,'-f',file];
const config=JSON.parse(docker([...compose,'config','--format','json']));
assert.equal(config.volumes.postgres_data.name,mount.Name,'refuse to switch database volumes');
assert.ok(config.services.db.image.startsWith('postgres:17.10-alpine@sha256:'));
const currentDatabaseEnvironment=Object.fromEntries(previous.Config.Env.map(value=>{const at=value.indexOf('=');return [value.slice(0,at),value.slice(at+1)];}));
for (const key of ['POSTGRES_DB','POSTGRES_USER','POSTGRES_PASSWORD','POSTGRES_PORT']) {
  if (String(config.services.db.environment[key])!==currentDatabaseEnvironment[key]) throw new Error(`${key} must not change during the upgrade`);
}
assert.ok(docker(['exec',source,'postgres','--version']).includes(' 17.'),'PostgreSQL major version must remain 17');
docker([...compose,'build','backend']);
const image=config.services.backend.image;
docker([...compose,'stop','backend']);
if(config.services.frontend) docker([...compose,'stop','frontend']);
const validation=spawnSync(process.execPath,[resolve('scripts/validate-docker.mjs'),source,image],{stdio:'inherit'});
assert.equal(validation.status,0,'backup/restore validation failed; original volume retained, application remains stopped');
docker([...compose,'up','-d','--wait','--wait-timeout','120','db']);
const after=JSON.parse(docker(['inspect',source]))[0];
assert.equal(after.Mounts.find(item=>item.Destination==='/var/lib/postgresql/data')?.Name,mount.Name);
docker([...compose,'run','--rm','--no-deps','migrate','/juicer-server','migrate','--adopt-legacy']);
docker([...compose,'up','-d','--wait','--wait-timeout','120','backend']);
if(config.services.frontend) docker([...compose,'up','-d','--wait','--wait-timeout','120','frontend']);
console.log(`Upgrade complete. Preserved volume: ${mount.Name}. Backups remain in .migration-validation/.`);
