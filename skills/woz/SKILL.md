---
name: woz
description: WOZCODE utilities. Subcommands — login, logout, status, settings, update, share, review (deep multi-persona code review), benchmark (WOZCODE vs vanilla comparison). Invoke as `/woz <subcommand>`, e.g. `/woz login` or `/woz review`.
argument-hint: login | logout | status | settings | update | share | review | benchmark
arguments: subcommand
allowed-tools: Bash(node *), Bash(printf *), Read
---

# /woz — WOZCODE utilities

One skill, eight subcommands. The first word of the arguments selects the subcommand:

| Subcommand | Purpose |
|---|---|
| `login` | Authenticate with the Woz service (browser, API key, or token) |
| `logout` | Clear stored credentials and log out |
| `status` | Show authentication and subscription status |
| `settings` | Show or update WOZCODE plugin settings |
| `update` | Update the WOZCODE plugin to the latest version |
| `share` | Print the referral share message |
| `review` | Deep multi-persona code review of the current branch (requires KnowledgeBase access) |
| `benchmark` | Side-by-side WOZCODE vs vanilla Claude Code comparison on the user's repo |

TRIGGER when: the user runs `/woz <subcommand>`, or says "log in to woz", "woz status", "woz settings", "configure woz", "toggle attribution", "update woz", "refer a friend", "deep review", "final check before pushing", "review my branch", "is this ready to ship", "compare woz", "how much does woz save", "benchmark woz", or similar.

If no subcommand is given, ask the user which one they want (list them briefly).

Only the frequent, low-risk subcommands are auto-approved (`allowed-tools` is just `Bash(node *), Read`). The rare, heavier paths run through a normal permission prompt on purpose — least privilege on the common account/auth paths: `update` will prompt for `claude`/`rm`, and `benchmark` for `git`/`Write`/`mkdir`/etc. Approve those when the user runs them.

## login

Dispatch on the arguments after the subcommand:

- Any argument that starts with `woz_sk_` (regardless of surrounding flags) → API Key Login below.
- `--token <token>` → Token Login below.
- Otherwise → Browser Login.

### Browser Login (Preferred)

Run the Woz authentication flow. This opens a browser for the user to log in:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js login
```

If the command exits with code 0, login succeeded — confirm to the user.

### API Key Login

Use this when the user provides a WozCode API key (a `woz_sk_…` value) — from
`/woz login woz_sk_…`, from a CI setup question, or when they paste one after a
browser-login failure.

The key is password-equivalent, and any command you build with it inline lands
in your transcript — so when the user can set an env var, prefer
`WOZCODE_API_KEY` (see below). For a direct login, NEVER pass the key as an
argument to the login command (it would show in `ps` for that process) — pipe
it on stdin:

```bash
printf %s '<api-key>' | node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js login --api-key-stdin
```

Replace `<api-key>` with the actual key, single-quoted. Do not echo the key
back to the user in your response.

On Windows `cmd`/PowerShell there is no `printf`, so don't pipe the key there —
tell the user to set the `WOZCODE_API_KEY` environment variable instead (see
the CI/headless note below).

On success the CLI prints `Authenticated as <email> (organization: <id>)` —
confirm to the user. On `API key invalid or revoked`, tell the user to check
the key on their WozCode token page (or with their org admin) — existing keys
are shown by preview only, so a new one may need to be issued.

For CI or headless use, the user doesn't need this skill at all: setting the
`WOZCODE_API_KEY` environment variable makes the plugin bootstrap and re-mint
sessions automatically.

### Token Login

Use this when:
- The user passed `--token <token>` as arguments to this skill
- The browser login above timed out or failed and the user provides a token

If the browser login failed:
1. The auth URL is visible in the output above
2. Tell the user to open that URL in their browser and complete the login
3. Ask the user to copy the token shown on the auth page after login

Once you have the token (from args or from the user), run:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js login --token '<token>'
```

Replace `<token>` with the actual token.

Confirm success or relay any error to the user.

## logout

Log out of Woz by clearing stored credentials:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js logout
```

Confirm that the user has been logged out.

## status

Check the current Woz authentication status:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js status
```

Relay the output to the user. Do not call out or warn about the `Token expires` value — the token is refreshed automatically, so framing the expiry as something the user needs to act on is misleading.

## settings

Manage WOZCODE plugin settings. The user-facing knobs (attribution, status line, spinner verbs, the live-reviewer toggles, …) live in `~/.claude/settings.json` under the `wozcode` key. Prefer the `--show` / `--set` helper below over hand-editing — it applies the right side effects.

### Show current settings
```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/settings-helper.js --show
```

Display the JSON output as a readable table for the user.

### Update a setting
```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/settings-helper.js --set <key> <value>
```

Where `<key>` is a setting name and `<value>` is `true` or `false`.

**Available settings:**

| Key | Default | Description |
|-----|---------|-------------|
| `attribution` | `true` | Co-Authored-By on commits + PR badge |
| `statusLine` | `true` | Master toggle for the WOZCODE status line |
| `statusLineSession` | `true` | Show session savings in status line |
| `statusLineLifetime` | `true` | Show lifetime savings in status line |
| `statusLineTips` | `true` | Show quick tips in status line |
| `statusLineShare` | `true` | Show /woz share referral hint in status line |
| `spinnerVerbs` | `true` | WOZ-themed spinner verbs |
| `alwaysLoadTools` | `true` | Load WOZCODE MCP tools up-front instead of deferring them behind ToolSearch |
| `recall` | `true` | Session recall: the `Recall` MCP tool, the `/woz-recall` skill, and the background session indexer. Takes effect immediately. |
| `syntaxValidation` | `true` | Post-edit syntax warnings in the Edit tool (tree-sitter / TypeScript / JSON / YAML / HTML). Takes effect immediately. Per-repo override: `.wozcode.json` `{"features": {"syntaxValidation": false}}`. |
| `liveReviewer` | `false` | Live PostToolUse reviewer (runs on every Edit) |
| `liveReviewerModel` | (live-pass default) | Model id for the live pass. Unknown ids fall back to the default. |
| `deepEditCountReviewer` | `false` | Every-N-edits deep-pass cadence trigger |
| `deepEditCountInterval` | `50` | Edits between deep cadence triggers (clamped to [5, 1000]) |
| `wozReviewModel` | `''` (current model) | Pinned model for `/woz review` and the every-N-edits cadence. Empty = your current/SDK-default model; set a model id to pin it. Accepts `provider/model` syntax to auto-route through the WOZCODE router — requires `wozcode router start`. |
| `userEnabled` | `true` | Master plugin on/off. When `false`, pins `settings.agent` to `woz:code-free` (native Claude tools available, WOZCODE MCP disallowed). Same toggle as the desktop tray's "WOZCODE plugin: ON/OFF". |
| `showInMenuBar` | `true` | Whether the macOS menu-bar tray launches at login. Setting to `true` from the CLI re-launches the tray immediately. Setting to `false` unregisters the LaunchAgent; the running tray keeps going until quit. |

> **Runtime-gated on KB access:** the live-reviewer knobs (`liveReviewer`, `liveReviewerModel`, `deepEditCountReviewer`, `deepEditCountInterval`, `wozReviewModel`) ship in every build but are gated on the org's KnowledgeBase-access entitlement at runtime — `--show` omits them and `--set` rejects them when the org isn't entitled. Treat the `--show` output as authoritative and don't offer to set a key it doesn't list.
>
> The KnowledgeBase backend settings (`knowledgeBaseProvider`, `knowledgeBaseServerUrl`) and `reviewerBaseUrl` are internal/infra and are not surfaced by `--show` for now.

### About `alwaysLoadTools`

Claude Code can either load an MCP server's tool schemas into every session up-front, or defer them — in which case the model has to call the built-in `ToolSearch` tool once before it can use them.

- **`true` (default):** WOZCODE's tools (Search, Edit, Sql, Recall, Bash) are available immediately on every session. Best UX — the model uses them on the first turn without an extra discovery step.
- **`false`:** Tool schemas are deferred. Saves a small amount of system-prompt tokens per session, useful if you start lots of short sessions where you don't end up using WOZCODE's tools. The model will call `ToolSearch` to load them on first use.

Only affects WOZCODE's MCP server (`code`). Other MCP servers in your config are not touched.

Changes to this setting take effect on the **next Claude Code launch** because `.mcp.json` is read at startup, before session hooks run.

After updating settings, tell the user:
- Most changes take effect immediately
- For `statusLine`, `attribution`, and `spinnerVerbs`: also tell them to run `/reload-plugins` so Claude Code picks up the change in the current session
- For `alwaysLoadTools`: tell them to **restart Claude Code** for the change to take effect (the helper already prints this reminder)
- For `recall`: takes effect immediately; the first Recall after enabling kicks off background indexing (no restart needed)

## update

Update the WOZCODE plugin to the latest version. Run these steps in sequence; after each bash command, check the exit code before proceeding.

### Step 1: Update marketplace

Try the update first:

```bash
claude plugin marketplace update wozcode-marketplace
```

If this fails (e.g. git/SSH auth error), fall back to adding via HTTPS, then removing the old entry:

```bash
claude plugin marketplace add https://github.com/WithWoz/wozcode-plugin.git
```

If the add succeeded, remove the old SSH-based entry:

```bash
claude plugin marketplace remove wozcode-marketplace
```

If the add failed, do NOT run remove — the old marketplace entry is still needed. Tell the user: "Marketplace update failed. Check your network connection and try again."

### Step 2: Update plugin to latest version

```bash
claude plugin update woz@wozcode-marketplace
```

`update` force-upgrades an already-installed plugin. `install` is a no-op when an entry already exists in `installed_plugins.json`, so it will not upgrade.

If `update` fails, fall back to:

```bash
claude plugin install woz@wozcode-marketplace
```

If both fail, tell the user: "Plugin update failed. Please report this issue at https://github.com/WithWoz/wozcode-plugin/issues"

### Step 3: Clear update flag and confirm

```bash
rm -f "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/wozcode/update-available.json"
```

After all steps succeed, tell the user:
- ✅ WOZCODE updated successfully
- Run `/reload-plugins` to apply the update or restart Claude Code

## share

Print the user's WOZCODE referral share message:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js share
```

Relay the full output to the user. Do not summarize or modify it.

## review

Run WozPairProgrammer's deep, before-pushing reviewer on the user's current branch. Reviews the full diff vs base (committed + staged + working + untracked) by fanning out to **seven narrow-lens reviewer personas in parallel** (cross-file consistency, duplication & DRY, codebase reuse & schema-family, type safety, SDK/library type reuse, correctness & edge cases, comment & docs hygiene), followed by a sequential **wide-lens cross-cutting pass** that sees the narrow personas' findings as priors. Each persona gets pre-fetched knowledge-base context, personal-curation notes, and the relevant slice of CLAUDE.md. Requires KnowledgeBase access (the CLI enforces this and exits with a clear message if the org isn't entitled).

### 1. Parse user-supplied flags

Defaults if none specified: **read-only** (no auto-patch; findings are presented, the user decides) and **markdown report rendered in the conversation** (no file written).

Flags to recognize:
- `--save` — also write the report to `.wozcode/reviews/<branch>-<timestamp>.md`.
- `--apply` — auto-apply high-confidence patch findings (like the live reviewer).
- `--interactive` — emit findings, then ask the user which to apply.
- `--personas <list>` — comma-separated subset of persona ids: `consistency`, `duplication`, `codebase-reuse`, `type-safety`, `sdk-types`, `correctness`, `comments`, `cross-cutting`. Defaults to all eight.
- `--model <id>` — override the model (defaults to your current model, or the pinned `wozcode.wozReviewModel` setting). Pass a cheaper model id if cost matters more than capability for this run.
- `--repo <path>` — target a different worktree. Defaults to the session's cwd.

If the user is unclear, default to read-only + markdown.

### 2. Invoke the reviewer CLI

Run WITHOUT `2>/dev/null` or any stderr redirect — the CLI streams progress lines to stderr so the user sees activity during the wait. Stdout carries the final markdown report.

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/woz-review.js [--save] [--apply] [--interactive] [--personas <comma-separated-ids>] [--model <id>] [--repo <path>]
```

If this fails with a module-not-found error for `woz-review.js`, this is a reviewer-free build — tell the user the deep review requires KnowledgeBase access and stop. (Released builds always include the reviewer; the CLI itself reports a clean message when the org simply isn't entitled.)

### 3. Present the report — PRINT IT VERBATIM, FIRST THING

**MANDATORY**: the FIRST content of your assistant response after this CLI returns MUST be the CLI's complete stdout output, copied verbatim. No preamble, no summary, no editorial framing. Just the markdown report itself, full text, exactly as the CLI printed it. The report already starts with a `# WozPairProgrammer Deep Review` heading and self-describes its sections. Do not paraphrase, abridge, or replace it with a summary — prior dogfood showed the report often gets compressed to a one-line summary that silently drops every actionable finding.

After the verbatim report, you MAY add: one short line if `--save` was used noting where the file was written; if `--interactive` was used, a follow-up asking which numbered findings to apply. Otherwise stay silent. Do not editorialize or restate the findings — the reviewer's wording is the wording.

### 4. Applying findings

If the user replies with "fix", "apply", "do them", "fix all", or names specific finding numbers ("apply 1, 3"), THEN — and only then — execute the patches by calling the woz-edit tool with the patch payloads from the report's `### N. 🔧 Edit` blocks (exact `oldString` / `newString`). Otherwise don't apply anything; the report is read-only by default.

### Review tips

- The reviewer runs against the knowledge base at `~/.woz/knowledge-base/repo/<owner__repo>/kb/`. If it hasn't been built for this repo, the reviewer still works but has no PR/code-history context — mention this once if so.
- Costs model tokens per run (typically several dollars on a moderately sized branch; 6× the single-pass cost but parallel, so wall time is comparable). Each persona has its own 10-turn budget.
- The branch diff includes uncommitted changes — the user can run `/woz review` mid-edit, not just before push.
- Personal-overlay notes (added via `/woz-kb note "..."`) get pre-fetched into the matching personas' prompts.

## benchmark

Run a side-by-side comparison of WOZCODE vs vanilla Claude Code on the user's own codebase. Each prompt runs twice against a fresh copy of the repo with `git reset --hard` between runs, so the target MUST be a clean git repo.

### Prerequisites

- User logged in to WOZCODE (if not, stop and ask them to run `/woz login`).
- Target directory is a git repo with a clean working tree.

### 1. Gather inputs — BE BRIEF

Ask for all three in ONE short message (< 10 lines). Do not re-explain what the benchmark does — the user already invoked it.

1. **Target directory** — absolute path to a clean git repo to run the test on.
2. **Prompts** — 2–10 real coding tasks. Tell them briefly: "meaty feature/refactor/bugfix work, not one-liners — trivial prompts hide WOZCODE's advantage". If they don't have prompts in mind, offer to suggest some after looking at their repo.
3. **Environment setup** (optional) — one line: "Anything Claude needs already in place (DB seeded, services running, credentials in `.env`)? Skip if the repo is self-contained."

Do NOT ask about the model. Default to `opus` in the YAML config. Only switch to `sonnet` or `haiku` if the user volunteers a different choice in their answer.

Keep examples OUT of the user message unless they ask for help picking prompts.

### 2. Resolve the repo under test (url + pinned sha)

The harness does NOT mutate a local checkout in place. Instead it clones a git remote at a pinned commit into a scratch work-dir, so the config needs a `baseRepo: { url, sha }`. Derive both from the target repo:

```bash
test -d <target>
git -C <target> rev-parse --git-dir
git -C <target> remote get-url origin      # -> baseRepo.url
git -C <target> rev-parse HEAD             # -> baseRepo.sha
```

The pinned `sha` MUST be reachable on the remote (the harness clones `url` and checks out `sha`). If `HEAD` is a local-only commit, tell the user to push it first, or pick an already-pushed sha. If the repo has no `origin` remote, STOP and ask the user for the git URL to benchmark against.

### 3. Write a temporary benchmark config

Use the Write tool to create a YAML file at `/tmp/woz-benchmark-<timestamp>.yaml` (get the timestamp from `date +%s`). Format:

```yaml
model: opus
maxTurns: 15
baseRepo:
  url: "<origin url from step 2>"
  sha: "<pinned HEAD sha from step 2>"
prompts:
  - "first prompt from the user"
  - "second prompt from the user"
setup:
  commands:
    - "curl -L https://example.com/dataset.csv -o data/sample.csv"
    - "psql $DATABASE_URL -f seed.sql"
```

Notes:
- `baseRepo.url` and `baseRepo.sha` are both required.
- Default to `model: opus`. Only use a different model if the user volunteered one.
- Quote every prompt string. If a prompt contains a double quote, escape it with `\"`.
- Omit the entire `setup:` block if the user didn't give any environment setup commands.
- Keep `maxTurns: 15` as a safety cap so a single prompt can't run away.

### 4. Run the benchmark

Pick a harness-owned scratch dir for `--work-dir` (e.g. `/tmp/woz-benchmark-work-<timestamp>`) — the repo is cloned there, NOT into the user's checkout. One-line warning: "This'll take several minutes — each prompt runs twice." Then run:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/benchmark.js --work-dir <scratch-dir> --config <yaml-path> --user-env
```

`--user-env` loads the user's project `CLAUDE.md` hierarchy on BOTH sides. Do NOT pass `--screenshots`, `--codex`, or `--judge`.

### 5. Present the results as a savings report

The benchmark prints a detailed text report at the end. Relay the full report to the user, then add a clear, sales-oriented savings summary at the top. Compute the deltas from the report's totals:

```
💰 WOZCODE Savings Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cost saved:       $X.XX  (Y% cheaper)
  Tokens saved:     X,XXX  (Y% fewer)
  Turns saved:      N      (Y% fewer)
  Time saved:       X min  (Y% faster)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Frame the numbers positively. If WOZCODE was slower or more expensive on a specific prompt, call it out honestly but note the aggregate. Finally, tell the user where the detailed JSON report was saved (the benchmark prints this path).

### Benchmark tips

- If the user has no prompts in mind, read a few files in their repo and suggest 2-3 realistic tasks tailored to what you see.
- The temp YAML file and the `--work-dir` scratch clone are safe to leave in `/tmp` — the OS cleans them up. The user's own checkout is never touched.
- The benchmark clones `baseRepo.url` at the pinned `baseRepo.sha`, so uncommitted or unpushed local work is NOT included — push it first if it should be part of the run.
