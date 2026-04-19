import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const isWin = process.platform === 'win32';
const nodeExecutable = process.execPath;
const n8nUserFolder = path.join(os.homedir(), '.n8n-node-cli');
const localN8nNodeCli = path.join(
  process.cwd(),
  'node_modules',
  '@n8n',
  'node-cli',
  'bin',
  'n8n-node.mjs',
);
const npmCliPath = isWin
  ? path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js')
  : path.join(path.dirname(path.dirname(process.execPath)), 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
const localN8nCache = path.join(process.cwd(), '.npm-n8n-cache');
const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);

const sharedEnv = {
  ...process.env,
  N8N_DEV_RELOAD: 'true',
  DB_SQLITE_POOL_SIZE: '10',
  N8N_USER_FOLDER: n8nUserFolder,
};

const processes = [];

function checkWindowsN8nPrereqs() {
  if (nodeMajorVersion !== 22) {
    console.error([
      'npm run dev requires Node.js 22 for this project.',
      '',
      'Reason:',
      '- The pinned n8n dev server used by this repo is currently stable with Node 22.',
      '- Node 24 triggers native dependency install failures on Windows during n8n startup.',
      '',
      'Switch this project shell to Node 22 and try again.',
    ].join('\n'));

    process.exit(1);
  }

  if (!isWin) return;
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

checkWindowsN8nPrereqs();

run('TypeScript + node link', nodeExecutable, [localN8nNodeCli, 'dev', '--external-n8n']);
run('n8n Server', nodeExecutable, [npmCliPath, 'exec', '--yes', '--package', 'n8n@1.123.15', '--', 'n8n'], {
  cwd: n8nUserFolder,
  env: {
    ...sharedEnv,
    npm_config_cache: localN8nCache,
  },
});
