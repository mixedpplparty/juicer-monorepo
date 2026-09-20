import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function docker(args) {
  const result = spawnSync('docker',args,{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);
  return result.stdout;
}
const temp = mkdtempSync(join(tmpdir(),'juicer-fresh-compose-'));
const env = join(temp,'.env');
writeFileSync(env,'POSTGRES_DB=juicer_test\nPOSTGRES_USER=juicer_test\nPOSTGRES_PASSWORD=test-only\nPOSTGRES_PORT=5432\n');
try {
  for (const [index,file] of ['docker-compose.yml','docker-compose-dev.yml','docker-compose-dev-server-debug.yml'].entries()) {
    const project=`juicer-fresh-${Date.now()}-${index}`;
    const config=JSON.parse(docker(['compose','--env-file',env,'-f',file,'config','--no-env-resolution','--format','json']));
    // Only replace deployment-specific names/ports and use the already built
    // image. Retain the real database volume and migration dependency wiring.
    const services={db:config.services.db,migrate:config.services.migrate};
    delete services.db.container_name;
    delete services.db.ports;
    delete services.migrate.build;
    services.migrate.image='juicer-migration-backend:test';
    const volumeName=`${project}_postgres_data`;
    const path=join(temp,`${index}.json`);
    writeFileSync(path,JSON.stringify({services,networks:{default:{}},volumes:{postgres_data:{name:volumeName}}}));
    const compose=['compose','-p',project,'-f',path];
    try {
      docker([...compose,'up','-d','--wait','--wait-timeout','120','db']);
      docker([...compose,'run','--rm','migrate']);
      docker([...compose,'run','--rm','migrate']);
      const count=docker([...compose,'exec','-T','db','psql','-XAt','-U','juicer_test','-d','juicer_test','-c','SELECT count(*) FROM _sqlx_migrations']).trim();
      assert.equal(count,'3');
      docker([...compose,'exec','-T','db','psql','-X','-v','ON_ERROR_STOP=1','-U','juicer_test','-d','juicer_test','-c',"INSERT INTO servers(server_id) VALUES ('survives-recreate')"]);
      docker([...compose,'up','-d','--force-recreate','--wait','--wait-timeout','120','db']);
      docker([...compose,'run','--rm','migrate']);
      const retained=docker([...compose,'exec','-T','db','psql','-XAt','-U','juicer_test','-d','juicer_test','-c',"SELECT count(*) FROM servers WHERE server_id='survives-recreate'"]).trim();
      assert.equal(retained,'1');
      console.log(`${file}: fresh setup, repeated migration, container recreation and data retention passed`);
    } finally {
      // This project and volume were created above, never a user's installation.
      docker([...compose,'down','--volumes']);
    }
  }
} finally { rmSync(temp,{recursive:true,force:true}); }
