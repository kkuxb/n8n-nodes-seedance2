import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const isWin = process.platform === 'win32';
const nodeExecutable = process.execPath;
const projectRoot = process.cwd();
const n8nVersion = '2.20.9';
const devRuntimeDir = path.join(projectRoot, '.n8n-dev-server');
const runtimePackageJson = path.join(devRuntimeDir, 'package.json');
const runtimeN8nManifest = path.join(devRuntimeDir, 'node_modules', 'n8n', 'package.json');
const runtimeN8nBinary = isWin
  ? path.join(devRuntimeDir, 'node_modules', '.bin', 'n8n.cmd')
  : path.join(devRuntimeDir, 'node_modules', '.bin', 'n8n');
const npmCliPath = isWin
  ? path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js')
  : path.join(path.dirname(path.dirname(process.execPath)), 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
const npmCache = path.join(projectRoot, '.npm-n8n-cache');

function readInstalledVersion() {
  if (!fs.existsSync(runtimeN8nManifest)) return null;

  try {
    const manifest = JSON.parse(fs.readFileSync(runtimeN8nManifest, 'utf8'));
    return manifest.version ?? null;
  } catch {
    return null;
  }
}

fs.mkdirSync(devRuntimeDir, { recursive: true });
fs.writeFileSync(
  runtimePackageJson,
  `${JSON.stringify({
    name: 'n8n-dev-server-runtime',
    private: true,
    description: 'Isolated local n8n runtime for npm run dev',
  }, null, 2)}\n`,
);

const installedVersion = readInstalledVersion();

if (installedVersion === n8nVersion && fs.existsSync(runtimeN8nBinary)) {
  console.log(`n8n@${n8nVersion} is already installed in ${devRuntimeDir}`);
  process.exit(0);
}

console.log(`Installing isolated n8n@${n8nVersion} runtime into ${devRuntimeDir}...`);

const install = spawnSync(
  nodeExecutable,
  [
    npmCliPath,
    'install',
    '--no-package-lock',
    '--save-exact',
    `n8n@${n8nVersion}`,
  ],
  {
    cwd: devRuntimeDir,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
  },
);

if (install.status !== 0 || !fs.existsSync(runtimeN8nBinary)) {
  process.exit(install.status ?? 1);
}
