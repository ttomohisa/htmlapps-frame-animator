'use strict';
// Never load configuration, npm settings, or executable code from the PR artifact.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const temp = process.env.RUNNER_TEMP;
const control = path.join(temp, 'preview-control');
fs.mkdirSync(control, { recursive: true });
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
if (!token || !account) { console.log('::notice::Preview skipped: credentials are not configured'); process.exit(0); }
if (!/^[a-f0-9]{32}$/i.test(account)) throw new Error('Invalid Cloudflare account ID');
const name = process.env.PREVIEW_NAME;
if (!/^r[0-9]+-pr-[1-9][0-9]*$/.test(name)) throw new Error('Invalid preview name');
if (process.argv[2] === 'delete') fs.mkdirSync(path.join(temp, 'preview-site'), { recursive: true });
const config = { name: 'bk-previews', compatibility_date: '2026-09-29', preview_urls: true, assets: { directory: path.join(temp, 'preview-site') }, previews: {} };
if (process.env.TRUSTED_MT_WORKER === 'true') {
  config.main = path.join(__dirname, 'preview-mt-worker.mjs');
  config.assets.binding = 'ASSETS';
  config.assets.run_worker_first = true;
}
const configPath = path.join(control, 'wrangler.json');
fs.writeFileSync(configPath, JSON.stringify(config));
const cli = path.join(control, 'node_modules/wrangler/bin/wrangler.js');
const args = [cli, 'preview'];
if (process.argv[2] === 'delete') args.push('delete');
args.push('--config', configPath, '--name', name);
args.push(process.argv[2] === 'delete' ? '--skip-confirmation' : '--json');
let output = '';
try {
  output = cp.execFileSync(process.execPath, args, {
    cwd: control, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, NO_COLOR: '1', CI: 'true', WRANGLER_SEND_METRICS: 'false' },
  });
} catch (error) {
  // Another cleanup can already have removed this preview. Wrangler reports
  // Cloudflare code 10025 in that case; deletion is idempotently complete.
  // Authentication, permission, network and all other errors must still fail.
  const details = String(error?.stderr || '') + '\n' + String(error?.stdout || '');
  if (process.argv[2] === 'delete' && /Preview not found\.\s*\[code:\s*10025\]/.test(details)) {
    console.log('::notice::Cloudflare preview is already absent; cleanup complete');
  } else {
    throw error;
  }
}
if (process.argv[2] !== 'delete') {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  const result = JSON.parse(output.slice(start, end + 1));
  const url = new URL(result.preview?.urls?.[0]);
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.endsWith('.workers.dev')) throw new Error('Invalid preview URL');
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${url.href.replace(/\/$/, '')}\n`);
  console.log(`Preview URL: ${url.href}`);
}
