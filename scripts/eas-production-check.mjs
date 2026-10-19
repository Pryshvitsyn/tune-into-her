import { spawnSync } from 'node:child_process';
if(process.env.EAS_BUILD_PROFILE==='production'){
 const result=spawnSync(process.execPath,['scripts/release-check.mjs'],{stdio:'inherit'});
 process.exit(result.status ?? 1);
}
