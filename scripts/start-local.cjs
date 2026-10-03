const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
process.chdir(root);

function supported(version) {
  const [major, minor] = version.replace(/^v/, '').split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 13);
}

if (!supported(process.version)) {
  const bundledNode = path.join(process.env.USERPROFILE || '', '.cache',
    'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'bin', 'node.exe');
  const version = spawnSync(bundledNode, ['--version'], { encoding: 'utf8' });
  if (version.status !== 0 || !supported(version.stdout.trim())) {
    console.error('This project requires Node.js 22.13+ (Node.js 24 recommended).');
    console.error('Install a supported Node.js version and launch start-local.cmd again.');
    process.exit(1);
  }
  const result = spawnSync(bundledNode, [__filename], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}

process.env.PATH = path.dirname(process.execPath) + path.delimiter + process.env.PATH;
console.log(`Starting with Node.js ${process.version}`);

try {
  fs.accessSync(path.join(root, 'node_modules/vinext/dist/cli.js'));
  for (const name of ['vite', 'miniflare', '@cspotcode/source-map-support',
    '@rolldown/binding-win32-x64-msvc']) require.resolve(name);
} catch {
  const npmPaths = spawnSync('where.exe', ['npm.cmd'], { encoding: 'utf8' });
  const candidates = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
    ...(npmPaths.stdout || '').trim().split(/\r?\n/).filter(Boolean)
      .map(file => path.join(path.dirname(file), 'node_modules/npm/bin/npm-cli.js'))];
  const npmCli = candidates.find(file => file && fs.existsSync(file));
  if (!npmCli) {
    console.error('npm was not found. Install Node.js with npm, then retry.');
    process.exit(1);
  }
  console.log('Restoring project dependencies from package-lock.json...');
  const install = spawnSync(process.execPath, [npmCli, 'ci', '--include=dev',
    '--include=optional', '--no-audit', '--no-fund'], { stdio: 'inherit' });
  if (install.error) console.error(install.error.message);
  if (install.status !== 0) process.exit(install.status ?? 1);
}

const dev = spawnSync(process.execPath, ['scripts/run-framework.mjs', 'dev'], {
  stdio: 'inherit',
});
if (dev.error) console.error(dev.error.message);
process.exit(dev.status ?? 1);
