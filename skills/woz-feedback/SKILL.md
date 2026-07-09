---
name: woz-feedback
description: Send feedback or a bug report to the WOZCODE team. Bug reports are tagged for triage and auto-attach session context (session id, anonymous id, OS, arch, Node version).
allowed-tools: Bash(node *)
---

# WOZCODE feedback & bug reports

TRIGGER when: user says "send feedback", "share feedback", "i wish woz", "feature request", "report a bug", "woz is broken", "file a bug", or runs `/woz-feedback`.

Decide the type from the user's words: broken behavior is a **bug**; feature requests and general thoughts are **feedback**.

If the user already described their feedback or bug in their message, use it directly. If they invoked `/woz-feedback` with no content (or said something too vague to act on), ask them — for feedback: "What would you like to share with the WOZCODE team?"; for a bug: "What broke? What did you do, what happened, and what did you expect?" — then wait for their reply before submitting.

Derive `subject` (one-line headline, ~80 chars max) and `body` (the full message, verbatim) from the user's words. Don't paraphrase or add boilerplate.

Submit by piping a JSON envelope to stdin. Use a single-quoted heredoc (`<<'WOZ_FEEDBACK'`) so the shell does NO expansion — user text like `$(cmd)` or backticks is passed through literally and cannot execute. JSON-encode `subject` and `body` so embedded `"`, `\\`, or newlines survive.

For general feedback (feature requests, thoughts) — this is the default, omit `type`:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js feedback <<'WOZ_FEEDBACK'
{"subject":"<json-escaped subject>","body":"<json-escaped body>"}
WOZ_FEEDBACK
```

For a bug report, add `"type":"BUG"` so it routes to bug triage:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js feedback <<'WOZ_FEEDBACK'
{"type":"BUG","subject":"<json-escaped subject>","body":"<json-escaped body>"}
WOZ_FEEDBACK
```

The CLI auto-attaches `CLAUDE_CODE_SESSION_ID`, anonymous telemetry id (unless the user opted out via `WOZCODE_TELEMETRY_DISABLED=true`), OS release, architecture, and Node.js runtime version. The email is auto-filled from the logged-in account.

On exit 0: tell the user "✅ Sent. Thanks." On non-zero: relay the error verbatim and mention `support@withwoz.com` as a fallback.
