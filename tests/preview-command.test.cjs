'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'scripts', 'preview-command.cjs'), 'utf8'
);

function runCommand(operation, errorDetails = null) {
  const logs = [];
  const writes = [];
  const env = {
    RUNNER_TEMP: '/tmp/preview-command-test',
    CLOUDFLARE_API_TOKEN: 'test-token-no-network',
    CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
    PREVIEW_NAME: 'r1408287832-pr-17',
    GITHUB_OUTPUT: '/tmp/preview-command-output'
  };
  const fakeFs = {
    mkdirSync() {},
    writeFileSync() {},
    appendFileSync: (...args) => writes.push(args)
  };
  const fakeCp = {
    execFileSync(_runtime, args) {
      assert.equal(args[1], 'preview');
      assert.equal(args.includes('delete'), operation === 'delete');
      if (errorDetails !== null) {
        const err = new Error('Wrangler failed');
        err.stderr = errorDetails;
        err.stdout = '';
        err.status = 1;
        throw err;
      }
      if (operation === 'delete') return '';
      return '{"preview":{"urls":["https://test-preview.workers.dev/"]}}';
    }
  };
  const fakeProcess = {
    env,
    argv: ['node', 'preview-command.cjs', operation],
    execPath: '/usr/bin/node'
  };
  const context = {
    __dirname: '/repo/.github/scripts',
    process: fakeProcess,
    URL,
    console: { log: message => logs.push(message) },
    require(name) {
      if (name === 'node:fs') return fakeFs;
      if (name === 'node:path') return path;
      if (name === 'node:child_process') return fakeCp;
      throw Error('Unexpected module: ' + name);
    }
  };
  vm.runInNewContext(source, context, { filename: 'preview-command.cjs' });
  return { logs, writes };
}

test('Cloudflare preview deletion succeeds when preview exists', () => {
  const result = runCommand('delete');
  assert.deepEqual(result.logs, []);
});

test('Cloudflare code 10025 is a successful no-op during cleanup', () => {
  const result = runCommand('delete', 'Preview not found. [code: 10025]');
  assert.ok(result.logs.some(x => x.includes('already absent')));
});

test('Cloudflare permission failures must still fail cleanup', () => {
  assert.throws(() => runCommand('delete', 'Forbidden [code: 10000]'), /Wrangler failed/);
});

test('Cloudflare 10025 must not mask preview creation failures', () => {
  assert.throws(() => runCommand('create', 'Preview not found. [code: 10025]'), /Wrangler failed/);
});

test('preview creation still validates and writes the worker URL', () => {
  const result = runCommand('create');
  assert.equal(result.writes.length, 1);
  assert.ok(result.writes[0][1].includes('preview_url=https://test-preview.workers.dev'));
});
