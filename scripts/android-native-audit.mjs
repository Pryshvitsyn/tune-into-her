import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// This is an explicitly non-store profile. All ordinary build hooks are no-ops.
if (process.env.EAS_BUILD_PROFILE !== 'native-audit') process.exit(0);
if (process.env.EAS_BUILD_PLATFORM !== 'android' || process.env.TIH_NATIVE_ARTIFACT_AUDIT !== '1') throw new Error('Explicit Android native audit required');
const reports = 'android/app/build/reports'; mkdirSync(reports, { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const sources = ['package.json', 'package-lock.json', 'eas.json', 'app.config.ts', 'assets/icon.png', 'assets/adaptive-icon.png', 'assets/launch/approved-opening.png', 'src/intro/timeline.ts', 'src/intro/sphereHtml.ts', 'src/intro/sceneRuntime.generated.ts', 'src/devQA/session.ts', 'src/context/AppContext.tsx', 'app/index.tsx', 'backend/src/worker.ts'];
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(directory, item.name)) : [path.join(directory, item.name)]);
for (const directory of ['app', 'src', 'content/editorial', 'plugins', 'assets/launch', 'assets/fonts']) sources.push(...files(directory));
const sourceHashes = Object.fromEntries([...new Set(sources)].filter(existsSync).sort().map(file => [file, sha(file)]));
writeFileSync(path.join(reports, 'tih-source-inputs.json'), JSON.stringify({ profile: 'native-audit', storeDistribution: false, uploadSigningConfigured: false, sourceHashes }, null, 2) + '\n');
if (process.argv[2] === 'prepare') {
  // Gradle can generate files inside autolinked dependencies. Run dependency
  // inspection after EAS has calculated/validated the native fingerprint.
  console.log('Recorded native audit source inputs; dependency inspection follows the actual build.');
} else if (process.argv[2] === 'verify') {
  const dependencyResult = spawnSync('./gradlew', [':app:dependencyInsight', '--dependency', 'com.android.billingclient', '--configuration', 'releaseRuntimeClasspath', '--console=plain'], { cwd: 'android', encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  writeFileSync(path.join(reports, 'tih-billing-dependency.txt'), (dependencyResult.stdout ?? '') + (dependencyResult.stderr ?? ''));
  if (dependencyResult.status !== 0) throw new Error('Actual Android release dependency resolution failed; inspect the private build report.');
  console.log('Recorded actual release Billing dependency graph; no catalog/purchase proof implied.');
  const directory = 'android/app/build/outputs/bundle/release';
  const bundles = readdirSync(directory).filter(file => file.endsWith('.aab'));
  if (bundles.length !== 1) throw new Error('Expected one native audit AAB');
  const apkDir = 'android/app/build/outputs/apk/release'; const apks = readdirSync(apkDir).filter(file => file.endsWith('.apk'));
  if (apks.length !== 1) throw new Error('Expected one native audit APK');
  const args = ['scripts/audit-native-artifact.py', '--aab', path.join(directory, bundles[0]), '--apk', path.join(apkDir, apks[0]), '--out', path.join(reports, 'tih-binary-audit.json')];
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk && existsSync(path.join(sdk, 'build-tools'))) {
    const tools = readdirSync(path.join(sdk, 'build-tools')).filter(file => /^\d+\.\d+\.\d+$/.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const zipalign = tools.length && path.join(sdk, 'build-tools', tools.at(-1), 'zipalign');
    if (zipalign && existsSync(zipalign)) args.push('--zipalign', zipalign);
  }
  const result = spawnSync('python3', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (!existsSync(path.join(reports, 'tih-binary-audit.json'))) throw new Error('Binary audit did not produce its explicit result');
  const audit = JSON.parse(readFileSync(path.join(reports, 'tih-binary-audit.json'), 'utf8'));
  console.log(JSON.stringify({ scope: 'Native audit profile, not a store-signed distribution', status: audit.status, checks: audit.checks, storeReadinessChanged: false }));
  // Missing store credentials/decoded bundle config keep the audit incomplete. They
  // are reported, never converted into store readiness or a fabricated signing pass.
  if (result.error || !['INCOMPLETE', 'PASS_BINARY_AUDIT_ONLY'].includes(audit.status)) throw new Error('Native artifact inspection failed; inspect the retained binary report.');
} else throw new Error('Choose prepare or verify');
