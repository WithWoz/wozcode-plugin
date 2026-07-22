---
id: overview
importance: high
filePaths: [README.md, .claude-plugin/plugin.json, codex/wozcode/.codex-plugin/plugin.json, package.json, codex/wozcode/package.json, servers/code-server.js]
relatedPages: [getting-started, architecture, risks-limitations]
---

# Overview

**Summary.** **OBSERVED:** WOZCODE is a Claude Code plugin that replaces built-in file operations with four MCP tools intended to reduce round trips and token usage ([`README.md:1-3`](../../README.md), [`README.md:50-61`](../../README.md)). The repository ships a Claude marketplace plugin plus a nested Codex variant, with executable code already bundled rather than maintained here as ordinary source modules.

## What ships

- **Claude surface:** marketplace/plugin manifests, `woz:code`, `woz:code-free`, `woz:explore`, a Node MCP server, lifecycle hooks, command skills, reviewer/KB/router utilities, and prebuilt assets ([`.claude-plugin/marketplace.json:2-20`](../../.claude-plugin/marketplace.json), [`agents/code.md:1-6`](../../agents/code.md), [`hooks/hooks.json:2-115`](../../hooks/hooks.json)).
- **Codex surface:** a separately packaged plugin with its own agents, skills, server, hooks, chunks, grammars, and native parser ([`codex/wozcode/.codex-plugin/plugin.json:2-10`](../../codex/wozcode/.codex-plugin/plugin.json), [`codex/wozcode/.mcp.json:2-15`](../../codex/wozcode/.mcp.json)).
- **Public capability:** Search, Edit, SQL introspection, past-session Recall, cost reporting, authentication/settings, benchmarking, deep review, and organization/repository knowledge operations ([`agents/code.md:2-5`](../../agents/code.md), [`skills/woz/SKILL.md:2-24`](../../skills/woz/SKILL.md), [`skills/woz-kb/SKILL.md:7-21`](../../skills/woz-kb/SKILL.md)).

## Repository character

**OBSERVED:** The root and nested runtime manifests only declare JavaScript module mode; they provide no dependency graph or build/test scripts ([`package.json:1-3`](../../package.json), [`codex/wozcode/package.json:1-3`](../../codex/wozcode/package.json)). Most production entrypoints are one-to-three physical lines of bundled/obfuscated JavaScript, while native `.node` modules and tree-sitter/SQL WASM are committed as artifacts.

**INFERRED:** This is a release artifact repository or marketplace payload, not the authoritative development source. Architecture can be mapped reliably at the integration boundary, but internal algorithms cannot be audited to source-level confidence from this tree alone.

## Evidence

- `README.md:1-76` — product and user surface.
- `.claude-plugin/plugin.json:2-8` — Claude identity/version.
- `codex/wozcode/.codex-plugin/plugin.json:2-10` — Codex identity/version and declared resources.
- `servers/code-server.js:3` — bundled MCP implementation anchor.

## Related

[Getting started](getting-started.md) · [Architecture](architecture.md) · [Risks and limitations](risks-limitations.md)
