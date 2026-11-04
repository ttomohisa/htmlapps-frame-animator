'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'release.yml'),
  'utf8'
);
const beginning = workflow.indexOf('      - name: Plan versioned release');
const ending = workflow.indexOf('      - name: Validate PowerShell syntax and encoding', beginning);
assert.ok(beginning >= 0 && ending > beginning, 'the release planner step exists');
const planner = workflow.slice(beginning, ending);

test('a missing first release does not leave a failing native exit status', () => {
  assert.match(planner, /gh release view \$tag/);
  assert.match(planner, /\$releaseExitCode\s*=\s*\$LASTEXITCODE/);
  assert.match(planner, /\$alreadyReleased\s*=\s*\$releaseExitCode -eq 0/);
  const successExit = planner.lastIndexOf('          exit 0');
  const output = planner.lastIndexOf('Write-Host "Tag:');
  assert.ok(successExit > output, 'the successful plan must explicitly exit 0 after emitting outputs');
  assert.equal(planner.slice(successExit).trim(), 'exit 0');
});

test('the release planner protects version, main ancestry and conflicting tags', () => {
  assert.match(planner, /\$env:RELEASE_REF -ceq 'refs\/heads\/main'/);
  assert.match(planner, /git merge-base --is-ancestor HEAD/);
  assert.match(planner, /\$tag -cnotmatch/);
  assert.match(planner, /\$tagExists/);
  assert.match(planner, /\$tagCommit -cne \$currentCommit/);
  assert.match(planner, /"publish=\$\(\$publish\.ToString\(\)\.ToLowerInvariant\(\)\)"/);
  assert.match(workflow, /gh release create \$tag @files --verify-tag/);
});
