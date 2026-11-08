# Impeccable integration

Source: https://github.com/pbakaus/impeccable and https://impeccable.style/docs/
Upstream version: **4.8.1** (engine 0.1.19, from upstream `package.json` as inspected 2026-11-08).

Install into the project using the official documented Codex CLI:

```sh
npx impeccable@4.8.1 install --providers=codex --scope=project
```

In Codex, invoke `$impeccable` with `critique`, `audit`, `distill` or `polish`; work in **Operate** mode. In a local terminal, use `npx impeccable@4.8.1 detect --json src/index.template.html` for a deterministic check. The automated hook is optional and requires local Codex trust. A GitHub Actions bootstrap workflow attempts the official project installation and commits generated skill files; read its logs for the exact outcome rather than assuming success.

This agent's container could not resolve GitHub/npm hosts and the local `npx --offline impeccable --version` failed with `ENOTCACHED`. Consequently **there has been no successful local CLI/launcher execution** in this task. The official Operate/craft-floor references were inspected from upstream, and the implementation used their design guidance. GitHub Actions runs the official CLI separately; its success must be checked independently. Do not describe manual design review as a successful CLI critique run.

Impeccable must not be embedded in either standalone HTML file. Runtime CSP/network restrictions remain unchanged.
