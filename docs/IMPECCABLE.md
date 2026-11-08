# Impeccable integration

Source: https://github.com/pbakaus/impeccable and https://impeccable.style/docs/
Upstream version: **4.8.1** (engine 0.1.19, from upstream `package.json` as inspected 2026-11-08).

Install into the project using the official documented Codex CLI:

```sh
npx impeccable@4.8.1 install --providers=codex --scope=project
```

In Codex, invoke `$impeccable` with `critique`, `audit`, `distill` or `polish`; work in **Operate** mode. In a local terminal, use `npx impeccable@4.8.1 detect --json src/index.template.html` for a deterministic check. The automated hook is optional and requires local Codex trust. Official project install completed successfully in GitHub Actions run [42491019184](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42491019184), which committed the Codex skill, pinned engine 0.1.19, `.codex/hooks.json` and enabled `.impeccable/config.json`. The temporary bootstrap workflow was then removed; future design audits run in `.github/workflows/impeccable-design-review.yml`.

This agent's container could not resolve GitHub/npm hosts and the local `npx --offline impeccable --version` failed with `ENOTCACHED`. Consequently **there has been no successful local CLI/launcher execution** in this task. The official Operate/craft-floor references were inspected from upstream, and the implementation used their design guidance. GitHub Actions separately ran the installed engine: `impeccable context --target src/index.template.html` and `impeccable detect --json src/index.template.html` both executed (run [42491263569](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42491263569)). The **initial** detector returned exit code 2 with six findings. All six were subsequently addressed without suppression, and the **latest strict** detector returned **0 findings (exit 0)** in [run 42497144305](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42497144305). The PR workflow now rejects exit code 2 instead of accepting it; details and browser regression evidence are in `docs/IMPECCABLE-REVIEW.md`. Do not describe manual design review as a successful CLI critique run.

Impeccable must not be embedded in either standalone HTML file. Runtime CSP/network restrictions remain unchanged.
