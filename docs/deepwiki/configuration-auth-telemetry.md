---
id: configuration-auth-telemetry
importance: high
filePaths: [README.md, .mcp.json, codex/wozcode/.mcp.json, hooks/hooks.json, skills/woz/SKILL.md, skills/woz-feedback/SKILL.md, skills/woz-kb/SKILL.md, codex/wozcode/skills/woz-login/SKILL.md, codex/wozcode/.codex-plugin/plugin.json, codex/wozcode/hooks/hooks.json]
relatedPages: [runtime-data-flow, testing-operations, risks-limitations]
---

# Configuration, Authentication, and Telemetry

**Summary.** **OBSERVED:** Claude settings live under `~/.claude/settings.json`; the MCP server is always loaded with PostHog enabled and a US-region client token in environment configuration ([`README.md:78-95`](../../README.md), [`.mcp.json:2-16`](../../.mcp.json)). Broad hooks make bootstrap, reviewer, and telemetry processing pervasive across a session ([`hooks/hooks.json:3-113`](../../hooks/hooks.json)).

## Settings

The README documents attribution, status-line session/lifetime/tips toggles, and spinner verbs, all defaulting on ([`README.md:78-95`](../../README.md)). The consolidated skill adds runtime-gated reviewer/KB settings, recall indexing, menu-bar/LaunchAgent behavior, fallback agent selection, and `alwaysLoadTools`; the latter only changes behavior on the next launch ([`skills/woz/SKILL.md:121-180`](../../skills/woz/SKILL.md)).

## Authentication paths

- **Browser login:** preferred; credentials are stored and refreshed automatically ([`README.md:32-48`](../../README.md)). Exact storage protection is **UNVERIFIED**.
- **API key:** the skill calls it password-equivalent and recommends stdin; CI can use `WOZCODE_API_KEY` ([`skills/woz/SKILL.md:48-78`](../../skills/woz/SKILL.md)).
- **Token JSON:** documented as a `--token` argument for headless login ([`skills/woz/SKILL.md:80-97`](../../skills/woz/SKILL.md), [`codex/wozcode/skills/woz-login/SKILL.md:29-47`](../../codex/wozcode/skills/woz-login/SKILL.md)). **INFERRED risk:** access/refresh tokens can enter shell history, process listings, and agent transcripts.

## Telemetry and data boundaries

**OBSERVED:** Both Claude and Codex MCP configs enable PostHog and embed a project ingestion token/US region ([`.mcp.json:10-15`](../../.mcp.json), [`codex/wozcode/.mcp.json:7-12`](../../codex/wozcode/.mcp.json)). Claude telemetry hooks run after every tool and on stop/subagent/compact events ([`hooks/hooks.json:52-113`](../../hooks/hooks.json)). Feedback includes session id, anonymous id unless opted out, OS/architecture/Node version, and logged-in email ([`skills/woz-feedback/SKILL.md:17-35`](../../skills/woz-feedback/SKILL.md)).

The KB distinguishes company organization data, repository code/PR history, and personal notes, with remote provider behavior documented as the normal path ([`skills/woz-kb/SKILL.md:94-108`](../../skills/woz-kb/SKILL.md), [`skills/woz-kb/SKILL.md:143-151`](../../skills/woz-kb/SKILL.md)).

## Unverified questions

- Credential file path, permissions, encryption/keychain use, refresh rotation, and revocation.
- Exact telemetry endpoints, event schemas, content redaction, buffering, retry, and retention.
- KB tenant isolation, retention, repository-content filtering, and deletion controls.
- Whether the Codex hooks file is activated: the manifest declares skills/MCP but does not explicitly reference hooks ([`codex/wozcode/.codex-plugin/plugin.json:8-10`](../../codex/wozcode/.codex-plugin/plugin.json), [`codex/wozcode/hooks/hooks.json:1-35`](../../codex/wozcode/hooks/hooks.json)).

## Evidence

- `.mcp.json:2-16`, `codex/wozcode/.mcp.json:2-15` — process environment.
- `hooks/hooks.json:3-113` — telemetry/reviewer/session frequency.
- `skills/woz/SKILL.md:48-180` — auth and settings behavior.

## Related

[Runtime and data flow](runtime-data-flow.md) · [Testing and operations](testing-operations.md) · [Risks and limitations](risks-limitations.md)
