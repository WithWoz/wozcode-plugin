# WOZCODE Plugin DeepWiki

Mode A, agent-native repository wiki generated from the local workspace. This repository is a prebuilt distribution: readable manifests, agent/skill definitions, and hook routing surround bundled JavaScript, native modules, and WASM. Claims are therefore labeled **OBSERVED**, **INFERRED**, or **UNVERIFIED**.

## Wiki blueprint

| Page | Importance | Focus |
|---|---|---|
| [Overview](overview.md) | high | Product purpose, repository shape, host surfaces |
| [Getting started](getting-started.md) | medium | Installation, authentication, management |
| [Architecture](architecture.md) | high | Components and deployment topology |
| [Runtime and data flow](runtime-data-flow.md) | high | MCP tools, agents, hooks, router |
| [Agents and commands](agents-commands.md) | medium | Agent policy and skill surface |
| [Configuration, auth, and telemetry](configuration-auth-telemetry.md) | high | Settings, credentials, network/data boundaries |
| [Testing and operations](testing-operations.md) | medium | Verification, benchmarks, updates, native assets |
| [Risks and limitations](risks-limitations.md) | high | Reviewability, supply chain, open questions |

## Scope and retrieval notes

- Included: root Claude plugin, nested Codex plugin, manifests, hooks, human-readable agents/skills, router config, thin entrypoints, selected artifacts, and a harmless MCP `initialize`/`tools/list` probe.
- Excluded from exhaustive reading: vendored `node_modules`, generated chunks, native binaries, WASM internals, PDFs/browser payloads, and full deobfuscation.
- No persistent vector index was created. Retrieval used file inventory, exact-symbol expansion, entrypoint ranking, focused reads, and one-hop import/config tracing.
- Repository state examined: Claude release `0.3.87`; nested Codex manifest `0.3.70` ([`.claude-plugin/plugin.json:2-8`](../../.claude-plugin/plugin.json), [`codex/wozcode/.codex-plugin/plugin.json:2-10`](../../codex/wozcode/.codex-plugin/plugin.json)).

## Evidence

- `README.md:1-76` — public purpose, install flow, agents, commands.
- `.mcp.json:2-16` — Claude MCP process and environment.
- `hooks/hooks.json:2-115` — Claude lifecycle integration.
- `codex/wozcode/.mcp.json:2-15` — Codex runtime packaging.

## Related

[Overview](overview.md) · [Architecture](architecture.md) · [Risks and limitations](risks-limitations.md)
