---
id: agents-commands
importance: medium
filePaths: [agents/code.md, agents/code-free.md, agents/explore.md, skills/woz/SKILL.md, skills/woz-kb/SKILL.md, skills/woz-feedback/SKILL.md, codex/wozcode/agents/code.toml, codex/wozcode/agents/explore.toml]
relatedPages: [architecture, runtime-data-flow, testing-operations]
---

# Agents and Commands

**Summary.** **OBSERVED:** WOZCODE changes tool policy more than model behavior: the main agent inherits the host model but forces MCP file operations, Explore uses Haiku for bounded read-only scans, and the free fallback restores native tools ([`agents/code.md:2-5`](../../agents/code.md), [`agents/explore.md:2-10`](../../agents/explore.md), [`agents/code-free.md:2-5`](../../agents/code-free.md)). Commands are implemented as skills and bundled CLI wrappers rather than a `commands/` directory.

## Agent matrix

| Agent | Model | Allowed intent | Key restriction |
|---|---|---|---|
| `woz:code` | inherit | coding, search, edit, SQL | native Read/Edit/Write/Grep/Glob disabled |
| `woz:explore` | Haiku | fast read-only lookup | no Woz Edit, nested Agent, or native file tools |
| `woz:code-free` | inherit | fallback when Woz cap is exhausted | Woz Search/Edit/Sql disabled |

Evidence: [`agents/code.md:1-6`](../../agents/code.md), [`agents/explore.md:1-10`](../../agents/explore.md), [`agents/code-free.md:1-6`](../../agents/code-free.md).

## Command surface

The consolidated `/woz` skill covers login, logout, status, settings, update, share, deep review, and benchmark ([`skills/woz/SKILL.md:2-24`](../../skills/woz/SKILL.md)). Focused skills add Recall, savings, feedback, and knowledge-base operations; several legacy skill names are deprecated aliases.

- **Account/config:** login, logout, status, settings ([`skills/woz/SKILL.md:30-180`](../../skills/woz/SKILL.md)).
- **Delivery:** update and share ([`skills/woz/SKILL.md:182-243`](../../skills/woz/SKILL.md)).
- **Quality:** seven-persona deep review and paired comparison benchmark ([`skills/woz/SKILL.md:244-379`](../../skills/woz/SKILL.md)).
- **Knowledge:** reviewer tuning/backtests, architecture fetch, cross-repo planning, query/note/suppress/boost/ingest/refresh/ops ([`skills/woz-kb/SKILL.md:7-21`](../../skills/woz-kb/SKILL.md), [`skills/woz-kb/SKILL.md:81-151`](../../skills/woz-kb/SKILL.md)).
- **Feedback:** sends bug/feedback context through the Woz CLI ([`skills/woz-feedback/SKILL.md:7-35`](../../skills/woz-feedback/SKILL.md)).

## Host parity

**OBSERVED:** Codex has three TOML agents but a smaller skill set than the Claude root. Its main agent directs file work to Search/Edit and reserves Bash for tests/build/scripts ([`codex/wozcode/agents/code.toml:1-14`](../../codex/wozcode/agents/code.toml)); Explore declares a read-only sandbox ([`codex/wozcode/agents/explore.toml:1-18`](../../codex/wozcode/agents/explore.toml)).

## Evidence

- `agents/*.md` — Claude agent policy.
- `skills/woz/SKILL.md:2-379` — main command contract.
- `skills/woz-kb/SKILL.md:7-151` — KB/reviewer workflows.
- `codex/wozcode/agents/*.toml` — Codex policy surface.

## Related

[Architecture](architecture.md) · [Runtime and data flow](runtime-data-flow.md) · [Testing and operations](testing-operations.md)
