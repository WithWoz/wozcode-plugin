---
id: testing-operations
importance: medium
filePaths: [README.md, package.json, standalone/package.json, skills/woz/SKILL.md, skills/woz-kb/SKILL.md, codex/wozcode/skills/woz-benchmark/SKILL.md, codex/wozcode/skills/woz-update/SKILL.md, browsers.json]
relatedPages: [getting-started, configuration-auth-telemetry, risks-limitations]
---

# Testing and Operations

**Summary.** **OBSERVED:** This distribution contains no first-party build, lint, or test scripts, no CI configuration, and no lockfile/SBOM/checksum manifest. Its user-facing verification mechanisms are live plugin checks, comparison benchmarks, reviewer backtests, and update/reinstall flows rather than repository-local tests ([`package.json:1-3`](../../package.json), [`skills/woz/SKILL.md:289-379`](../../skills/woz/SKILL.md)).

## Verification surfaces

- **Activation:** restart Claude and confirm the `woz:code` badge ([`README.md:16-30`](../../README.md)).
- **Benchmark:** clone a pinned remote SHA into a scratch directory and run each prompt twice, capped at 15 turns ([`skills/woz/SKILL.md:310-355`](../../skills/woz/SKILL.md)). This avoids mutating the user's checkout.
- **Reviewer tuning/backtest:** use fresh per-PR clones, remove origin/disable pushes, strip GitHub tokens, sandbox HOME, and write reports under `.wozcode/backtests` ([`skills/woz-kb/SKILL.md:69-77`](../../skills/woz-kb/SKILL.md)).

**OBSERVED drift:** older Codex benchmark instructions operate on a clean target and describe `git reset --hard` between runs ([`codex/wozcode/skills/woz-benchmark/SKILL.md:7-16`](../../codex/wozcode/skills/woz-benchmark/SKILL.md), [`codex/wozcode/skills/woz-benchmark/SKILL.md:60-68`](../../codex/wozcode/skills/woz-benchmark/SKILL.md)). Treat that workflow as materially more destructive than the current Claude benchmark.

## Update operations

Claude update follows mutable marketplace names, with an HTTPS repository fallback but no documented commit/hash/signature verification ([`skills/woz/SKILL.md:182-222`](../../skills/woz/SKILL.md), [`README.md:105-122`](../../README.md)). Codex uses unversioned `npx @wozcode/codex update` ([`codex/wozcode/skills/woz-update/SKILL.md:7-15`](../../codex/wozcode/skills/woz-update/SKILL.md)).

## Shipped platform assets

- Query-parser native modules for Darwin arm64/x64 and Linux x64/musl x64 under `build/Release/`.
- Tree-sitter grammar WASM and `libpg-query.wasm` under `grammars/` and `chunks/`.
- Browser revision metadata pins Chromium, Firefox, WebKit, ffmpeg, and platform overrides ([`browsers.json:4-68`](../../browsers.json)).
- Vendored dependencies include `node-pty`, AJV, and a local canvas stub; provenance/checksum verification is not documented.

## Recommended release gates

These are **recommendations**, not observed repository behavior:

1. Publish the authoritative source revision and reproducible build instructions for every release artifact.
2. Add CI smoke tests for MCP initialize/tools-list and representative Search/Edit/Sql/Recall schemas.
3. Add lockfiles, SBOM, checksums/signatures, and native/WASM provenance.
4. Align Claude/Codex versions and benchmark safety semantics before publication.

## Evidence

- `package.json:1-3`, `standalone/package.json:1-3` — no scripts/dependencies.
- `skills/woz/SKILL.md:289-379` — current benchmark contract.
- `skills/woz-kb/SKILL.md:69-77` — backtest sandbox contract.
- `browsers.json:4-68` — pinned runtime assets.

## Related

[Getting started](getting-started.md) · [Configuration, auth, and telemetry](configuration-auth-telemetry.md) · [Risks and limitations](risks-limitations.md)
