import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const isWin = process.platform === 'win32';
const nodeExecutable = process.execPath;
const projectRoot = process.cwd();
const n8nUserFolder = path.join(os.homedir(), '.n8n-node-cli');
const localN8nNodeCli = path.join(
  projectRoot,
  'node_modules',
  '@n8n',
  'node-cli',
  'bin',
  'n8n-node.mjs',
);
const localN8nBinary = isWin
  ? path.join(projectRoot, 'node_modules', '.bin', 'n8n.cmd')
  : path.join(projectRoot, 'node_modules', '.bin', 'n8n');

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
    'Run `npm install` in this project before `npm run dev`.',
    'The dev server uses the project-local n8n dependency and no longer installs n8n on startup.',
  ].join('\n'));
  process.exit(1);
}

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: isWin,
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

run('TypeScript + node link', nodeExecutable, [localN8nNodeCli, 'dev', '--external-n8n']);
run('n8n Server', localN8nBinary, [], {
  cwd: n8nUserFolder,
});
