// Builds the web bundle, syncs it into the Capacitor Android shell, assembles a
// debug APK via Gradle, and publishes it to public/downloads/stanz-calc.apk so
// it's served from https://stanz-apps.online/downloads/stanz-calc.apk on the next deploy.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === 'win32';

function run(cmd, args, cwd) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  if (isWindows) {
    // Join into one command line: avoids Node's shell+args escaping warning on win32.
    execFileSync([cmd, ...args].join(' '), [], { cwd, stdio: 'inherit', shell: true });
  } else {
    execFileSync(cmd, args, { cwd, stdio: 'inherit' });
  }
}

run('npx', ['vite', 'build'], root);
run('npx', ['cap', 'sync', 'android'], root);

const gradlew = isWindows ? '.\\gradlew.bat' : './gradlew';
const buildType = process.env.APK_BUILD_TYPE === 'release' ? 'Release' : 'Debug';
run(gradlew, [`assemble${buildType}`, '--no-daemon'], join(root, 'android'));

const apkPath = join(
  root,
  'android', 'app', 'build', 'outputs', 'apk',
  buildType.toLowerCase(), `app-${buildType.toLowerCase()}.apk`,
);

if (!existsSync(apkPath)) {
  throw new Error(`Expected APK not found at ${apkPath}`);
}

const outDir = join(root, 'public', 'downloads');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'stanz-calc.apk');
copyFileSync(apkPath, outPath);
console.log(`Published ${apkPath} -> ${outPath}`);

// Rebuild dist/ so it picks up the just-published APK (the first vite build above
// ran before the APK existed, so dist/downloads would otherwise be stale).
run('npx', ['vite', 'build'], root);
