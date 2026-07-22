---
id: getting-started
importance: medium
filePaths: [README.md, skills/woz/SKILL.md, codex/wozcode/.codex-plugin/plugin.json, codex/wozcode/skills/woz-update/SKILL.md]
relatedPages: [overview, configuration-auth-telemetry, testing-operations]
---

# Getting Started

**Summary.** **OBSERVED:** Claude installation is marketplace-driven, requires a restart, and uses the `woz:code` badge as the visible activation check ([`README.md:5-30`](../../README.md)). A Woz account is required for tool use; browser login is the preferred path and credentials are persisted/refreshed ([`README.md:32-48`](../../README.md)).

## Claude install and verification

1. Run `/plugin marketplace add WithWoz/wozcode-plugin` and `/plugin install woz@wozcode-marketplace` ([`README.md:7-14`](../../README.md)).
2. Restart with `claude` ([`README.md:16-22`](../../README.md)).
3. Confirm the `woz:code` badge, then run `/woz login` or the legacy `/woz-login` alias ([`README.md:24-40`](../../README.md), [`skills/woz/SKILL.md:30-47`](../../skills/woz/SKILL.md)).

For headless use, the README documents copying token JSON from the browser success page into a CLI argument ([`README.md:42-48`](../../README.md)). See [Configuration, auth, and telemetry](configuration-auth-telemetry.md) before using that path because command-line tokens can leak through history or process inspection.

## Management

- Disable, enable, or remove through Claude's plugin commands ([`README.md:97-103`](../../README.md)).
- Update via `/woz update`; the documented recovery path refreshes the marketplace, reinstalls the plugin, and clears update flags ([`README.md:105-122`](../../README.md)).
- Launch explicitly with `claude --agent woz:code` for debugging ([`README.md:124-130`](../../README.md)).
- Conductor integration uses the generated `wozcode conductor` executable; only Search and Edit are explicitly claimed to work there ([`README.md:132-148`](../../README.md)).

## Codex

**OBSERVED:** The nested Codex plugin declares skills and its MCP server, but this repository's README does not document a complete initial Codex install flow ([`codex/wozcode/.codex-plugin/plugin.json:2-10`](../../codex/wozcode/.codex-plugin/plugin.json)). Its update command uses `npx @wozcode/codex update` ([`codex/wozcode/skills/woz-update/SKILL.md:7-15`](../../codex/wozcode/skills/woz-update/SKILL.md)).

## Evidence

- `README.md:5-48` — install, restart, verify, login.
- `README.md:97-148` — lifecycle management and Conductor.
- `skills/woz/SKILL.md:30-116` — consolidated auth/status commands.

## Related

[Overview](overview.md) · [Configuration, auth, and telemetry](configuration-auth-telemetry.md) · [Testing and operations](testing-operations.md)
