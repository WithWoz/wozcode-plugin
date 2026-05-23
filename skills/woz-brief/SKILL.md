---
name: woz-brief
description: "Toggle WOZCODE output verbosity for the current session. /woz-brief lite for fragment-style minimum-token replies, /woz-brief full for normal verbosity. TRIGGER on /woz-brief, 'be brief', 'lite mode', 'full verbosity'."
allowed-tools: Bash(mkdir *), Bash(node *), Bash(cat *), Bash(printf *)
---

# WOZ Brief

User-controlled output verbosity for the current session. Layers on top of the always-on terse defaults in the `woz:code` agent — `lite` strips even further, `full` restores normal prose.

## Arguments

- `lite` — maximum brevity. One-line answers when possible.
- `full` — restore default conversational verbosity.
- (no arg) — print the current mode.

## Behavior

1. Parse the user's argument (`lite`, `full`, or empty). If empty, read the current value from `${CLAUDE_PROJECT_DIR}/.wozcode/brief-mode` (default: `default`) and report it.
2. Otherwise, persist the choice so future SessionStart-injected reminders pick it up:
   ```bash
   mkdir -p "${CLAUDE_PROJECT_DIR}/.wozcode"
   printf '%s\n' "<mode>" > "${CLAUDE_PROJECT_DIR}/.wozcode/brief-mode"
   ```
3. Acknowledge the switch in one short line (e.g., `brief: lite`) and immediately follow the rules below for the rest of the session.

## Lite mode rules

Apply these for every response until the user switches back to `full`:

- Fragments over sentences. Skip articles when the meaning is clear.
- No preambles, no transitions, no trailing summaries.
- One short status line per tool batch — not per tool call.
- After edits: one line per file (`path: what changed`). No diff recap.
- Drop courtesy phrases ("Sure!", "Of course", "Let me know if…").
- Headers/bullets only when the answer has 3+ genuinely distinct parts.
- Code blocks: minimum needed to answer. No surrounding explanation unless asked.

## Full mode rules

Revert to the default `woz:code` agent voice (already terse — see `agents/code.md`). No extra suppression.

## Persistence

The mode is written to `.wozcode/brief-mode` in the project directory. A SessionStart-injected reminder re-applies it on future sessions so the user does not have to retoggle. If the file is missing, treat the mode as `default` (same as `full`).
