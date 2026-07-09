---
description: The WOZCODE knowledge base behind the /woz review reviewer. Subcommands — `tune` (end-to-end reviewer tuning), `backtest` (tuning building blocks), and knowledge-base ops (`status`, `query`, `note`, `suppress`, `boost`, `ingest`, `refresh`, `ops`).
argument-hint: tune | backtest | status | query | note | suppress | boost | ingest | refresh | ops
arguments: subcommand
---

# /woz-kb — the reviewer's knowledge base

One skill, three subcommands:

- **`woz-kb tune`** — the start-to-finish orchestrator: distill → backtest → learn (autotuner new-personas + per-PR missed-fixes) → re-measure the lift. Dry-run by default; `--apply` writes to the KB. Use this to onboard/tune a new repo or a whole org.
- **`woz-kb backtest`** — the building blocks for power users: the raw backtest run plus `--tune`, `--missed-report`, `--org-tune`, `--ab-compare` (unchanged).
- **knowledge-base ops** (`status`, `query`, `note`, `unnote`, `suppress`, `unsuppress`, `boost`, `unboost`, `ingest`, `refresh`, `ops`) — inspect and customize the knowledge base directly, e.g. `/woz-kb status`, `/woz-kb note "..."`, `/woz-kb query <text>`.

The first positional arg selects the subcommand; if omitted it defaults to `backtest` (back-compat). `tune` and `backtest` run through `woz-kb.js`; the knowledge-base ops run through `woz-knowledge.js` (see that section).

## When to use

TRIGGER for tune/backtest: "tune the reviewer", "tune this repo", "onboard a repo", "tune the org", "backtest the reviewer", "how well does the reviewer do", or `/woz-kb`.

TRIGGER for knowledge-base ops: "knowledge base status", "what's in the knowledge base", "search the knowledge base for …", "add a knowledge-base note", "remember that X", "suppress this" / "stop the reviewer from citing X", "boost this", "ingest <file> into the knowledge base", "refresh the knowledge base", or `/woz-kb status` / `/woz-kb note` / `/woz-kb query`.

DO NOT use for: reviewing the current branch (`/woz review`) or past-session recall (`/woz-recall` — searches Claude Code session transcripts, not the knowledge base). General-purpose code search belongs to `mcp__plugin_woz_code__Search`, not the KB.

---

## `woz-kb tune` — start-to-finish

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/woz-kb.js tune \
  --repo with-woz/wozcode \
  --anthropic-api-key-file ~/.woz/.anthropic-backtest-key
```

Pipeline per repo: **(1)** trigger a KB refresh → **(2)** distill human PR comments into baseline persona-hints → **(3)** training backtest (20 PRs × 3 rounds, or reuse a cached run) → **(4)** learn: the autotuner contributes **new personas** (its unique cross-PR synthesis), then missed-fixes contributes the **per-PR durable persona-hints** → **(5)** re-measure on the same PRs and print the recall/precision lift.

Flags:
- `--repo <owner/name>` — tune one repo. **Mutually exclusive with `--org`.**
- `--org <orgId>` — tune every repo the org has indexed, then run a final company-scope org-tune.
- `--apply` — write to the KB. **Without it, `tune` is a dry-run**: it computes + reports proposed hints/personas and counts but writes nothing (and skips the re-measure, since nothing changed).
- `--reuse-run <runId>` — reuse an existing backtest run's PRs + baseline instead of running a fresh (expensive) reviewer pass. `tune` also auto-reuses the newest cached run for the repo when present.
- `--count <n>` / `--rounds <n|all>` — training-backtest size (defaults 20 / 3) when not reusing a run.
- `--skip-distill` / `--skip-refresh` / `--skip-remeasure` — drop individual phases.
- `--anthropic-api-key-file <path>` — use API pricing for the reviewer/judge subprocesses.
- `--judge-model` / `--reviewer-model` / `--reviewer-via` / `--source` — as in `backtest`.

Note: after an `--apply`, the reviewer cache is invalidated (KB changed), so the re-measure re-runs the reviewer on the (small) PR set — a real cost, not a cache hit.

---

## `woz-kb backtest` — building blocks

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/woz-kb.js backtest \
  --repo with-woz/wozcode --count 3 --rounds 1
```

Runs the deep reviewer against a sample of historical merged PRs and scores how close it gets — the reviewer never sees the human comments or merged diff, so the score is a real recall measure. Key flags:
- `--repo <owner/name>` (required), `--source <path>` (default cwd), `--count <n>` (default 3), `--rounds <n|all>` (per-review-round scoring), `--prs <n,n,n>` (explicit PRs; reuse a prior run's set for a comparable measurement).
- `--tune <runId> [--tune-apply] [--min-apply-ratio <n>]` — autotuner over a finished run.
- `--missed-report <runId> [--tune-apply]` — per-PR missed→suggested-fixes; writes `missed-fixes.json` + `.md`.
- `--org-tune <orgId> [--org-tune-all | --org-tune-repos <list>] [--org-tune-apply]` — cross-repo → company scope.
- `--ab-compare <baselineRunId> <newRunId> [--auto-rollback]`, `--personas <ids>`, `--no-apply`, `--timeout-min <n>`.

## Safety contract (backtest runs)

- A fresh clone per PR at `<repo>/.wozcode/backtests/<runId>/pr-<n>/clone/`; `.wozcode/` is gitignored.
- The clone's `origin` is removed and push URLs are rewritten to `unreachable://` for both `https://` and `git@`; `GH_TOKEN`/`GITHUB_TOKEN`/`GH_ENTERPRISE_TOKEN` are stripped and `HOME` is sandboxed. The reviewer cannot push or authenticate.
- Read-only against upstream. Artifacts persist for inspection.

## Output

Each run writes `<source>/.wozcode/backtests/<runId>/`: `report.md`, `summary.json`, and per-PR/round `reviewer.md`, `findings.json`, `score.json`, `usage.json`. `--missed-report` adds `missed-fixes.{json,md}`; `tune` prints the recall/precision lift.

---

## Knowledge-base ops (`status`, `query`, `note`, …) — inspect and customize

These run as direct `/woz-kb <op>` subcommands (e.g. `/woz-kb status`). The knowledge base has three layers, queried bottom-up:

| Layer | Source | Sync? |
|---|---|---|
| **company** | org-wide chunks (cross-repo learned rules) | server (v2) |
| **repo** | code files + PR history + distilled rules | local (v1) / server (v2) |
| **personal** | your notes, suppressions, boosts | local (v1) / server (v2) |

These ops are a thin wrapper around a dedicated CLI (note: `woz-knowledge.js`, not `woz-kb.js`):

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/woz-knowledge.js <subcommand> [args] [--json]
```

Run WITHOUT `2>/dev/null` — stderr surfaces useful errors (login required, not in a github repo, etc.). Use `--json` when you need to programmatically inspect output; use the human-readable output when you'll just print it back to the user verbatim.

### Map the user's intent to a subcommand

When ambiguous, prefer `status` + a clarifying question over a guess.

| User says... | Subcommand |
|---|---|
| status / what's indexed / health check | `status` |
| search / find / look for | `query <text>` |
| remember / note / always use | `note "<text>"` (add `--repo` only when user explicitly says "for this repo") |
| remove note / forget note | `unnote <noteId>` (add `--repo` if the note is repo-scoped) |
| suppress / hide / stop showing | `suppress <chunkId>` |
| undo suppress / unhide | `unsuppress <chunkId>` |
| boost / weight higher | `boost <chunkId> <factor>` |
| undo boost | `unboost <chunkId>` |
| ingest / add this file | `ingest <path>` |
| refresh / rebuild | `refresh` |
| my notes / show overlay | `ops` |

For `suppress` / `unsuppress` / `boost` / `unboost`, the user almost never knows the chunkId off the top of their head. The natural flow is:
1. Run `query <their phrasing>` first to surface candidate hits with ids.
2. Show the user the top hits with their ids.
3. Ask which id to act on, then run the next subcommand.

### Present the output

- **`status` and `query`:** print the CLI output verbatim — the formatting is already user-facing.
- **`note` / `unnote` / `suppress` / `boost` / `unsuppress` / `unboost`:** print the one-line confirmation the CLI emits, followed by the new op id so the user can undo if they want.
- **`ingest`:** print the chunks-added summary.
- **`refresh`:** print the jobId. The local provider's refresh is fire-and-forget; results land in the next `status` call.
- **`ops`:** if the user is reviewing what they've done, print verbatim. If they're looking for something specific ("what did I suppress yesterday?"), filter the JSON output and present a focused list.

### Authentication

Personal-overlay subcommands (`note`, `suppress`, `boost`, etc.) require login. The CLI surfaces "login required" on stderr; if you see that, tell the user to run `/woz login` and retry. Do NOT silently no-op.

### Knowledge tips

- The knowledge base is keyed by GitHub origin (`github:owner/repo`). If the user is in a non-GitHub repo or a worktree without `origin`, repo-scoped ops will skip the repo layer and only operate on personal-global notes.
- The knowledge-base backend (the on-disk store vs the Woz knowledge-base server, `'remote'` by default) is an internal setting — it is not configurable via `/woz settings`. Same CLI surface either way.
- `query` runs against every layer the user has access to and merges results with overlay ops applied. The `[scope/kind]` tag on each hit shows where it came from.
