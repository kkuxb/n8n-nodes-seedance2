import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const isWin = process.platform === 'win32';
const nodeExecutable = process.execPath;
const projectRoot = process.cwd();
const n8nUserFolder = path.join(os.homedir(), '.n8n-node-cli');
const devRuntimeDir = path.join(projectRoot, '.n8n-dev-server');
const devPackageRoot = path.join(projectRoot, '.n8n-dev-package');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageManifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageName = packageManifest.name;
const cleanPackageDir = path.join(devPackageRoot, packageName);
const customNodeModulesDir = path.join(n8nUserFolder, '.n8n', 'custom', 'node_modules');
const customPackageLink = path.join(customNodeModulesDir, packageName);
const localTscBinary = isWin
  ? path.join(projectRoot, 'node_modules', '.bin', 'tsc.cmd')
  : path.join(projectRoot, 'node_modules', '.bin', 'tsc');
const localTscScript = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const localN8nNodeCli = path.join(
  projectRoot,
  'node_modules',
  '@n8n',
  'node-cli',
  'bin',
  'n8n-node.mjs',
);
const localN8nBinary = isWin
  ? path.join(devRuntimeDir, 'node_modules', '.bin', 'n8n.cmd')
  : path.join(devRuntimeDir, 'node_modules', '.bin', 'n8n');
const localN8nScript = path.join(devRuntimeDir, 'node_modules', 'n8n', 'bin', 'n8n');

const sharedEnv = {
  ...process.env,
  N8N_DEV_RELOAD: 'true',
  DB_SQLITE_POOL_SIZE: '10',
  N8N_USER_FOLDER: n8nUserFolder,
};

const processes = [];

function requireLocalDependency(label, filePath) {
  if (fs.existsSync(filePath)) return;

  console.error([
    `Missing local ${label}: ${filePath}`,
    '',
    label === 'n8n'
      ? 'Run `npm run dev:setup` once before `npm run dev`.'
      : 'Run `npm install` in this project before `npm run dev`.',
    'The dev server uses the project-local n8n runtime and no longer installs n8n on startup.',
  ].join('\n'));
  process.exit(1);
}

function resetLink(linkPath, targetPath, type = 'junction') {
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(targetPath, linkPath, type);
}

function prepareCleanCustomPackage() {
  fs.mkdirSync(cleanPackageDir, { recursive: true });
  fs.mkdirSync(customNodeModulesDir, { recursive: true });

  const cleanManifest = {
    name: packageManifest.name,
    version: packageManifest.version,
    description: packageManifest.description,
    main: packageManifest.main,
    n8n: packageManifest.n8n,
  };

  fs.writeFileSync(
    path.join(cleanPackageDir, 'package.json'),
    `${JSON.stringify(cleanManifest, null, 2)}\n`,
  );

  resetLink(path.join(cleanPackageDir, 'dist'), path.join(projectRoot, 'dist'));
  resetLink(customPackageLink, cleanPackageDir);
}

function runInitialBuild() {
  const build = spawnSync(nodeExecutable, [localN8nNodeCli, 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    env: sharedEnv,
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: sharedEnv,
    ...options,
  });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[${name}] exited with ${reason}`);
    shutdown(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed:`, error);
    shutdown(1);
  });

  processes.push(child);
  return child;
}

let shuttingDown = false;

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) child.kill();
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

requireLocalDependency('@n8n/node-cli', localN8nNodeCli);
requireLocalDependency('n8n', localN8nBinary);
requireLocalDependency('TypeScript', localTscBinary);
requireLocalDependency('TypeScript script', localTscScript);
requireLocalDependency('n8n script', localN8nScript);

runInitialBuild();
prepareCleanCustomPackage();

run('TypeScript Build (watching)', nodeExecutable, [localTscScript, '--watch', '--pretty']);
run('n8n Server', nodeExecutable, [localN8nScript], {
  cwd: n8nUserFolder,
  env: {
    ...sharedEnv,
    NODE_PATH: [
      path.join(projectRoot, 'node_modules'),
      path.join(devRuntimeDir, 'node_modules'),
      process.env.NODE_PATH,
    ].filter(Boolean).join(path.delimiter),
  },
});
