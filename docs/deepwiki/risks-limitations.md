---
id: risks-limitations
importance: high
filePaths: [servers/code-server.js, .claude-plugin/plugin.json, codex/wozcode/.codex-plugin/plugin.json, .mcp.json, hooks/hooks.json, skills/woz/SKILL.md, codex/wozcode/skills/woz-update/SKILL.md, codex/wozcode/skills/woz-benchmark/SKILL.md, package.json, LICENSE]
relatedPages: [overview, configuration-auth-telemetry, testing-operations]
---

# Risks and Limitations

**Summary.** The dominant architectural risk is not a proven defect but an assurance gap: privileged, network-capable code is shipped as obfuscated bundles plus native/WASM artifacts without its source/build/test/provenance chain. Default-on telemetry, argv token login, mutable update channels, and Claude/Codex version drift deserve focused follow-up.

## Observed risks

| Area | Evidence | Consequence |
|---|---|---|
| Reviewability | Production entrypoints collapse into one-to-three obfuscated lines, e.g. [`servers/code-server.js:3`](../../servers/code-server.js) | Internal behavior and redaction are difficult to independently audit |
| Version parity | Claude `0.3.87` vs Codex `0.3.70` ([`.claude-plugin/plugin.json:2-8`](../../.claude-plugin/plugin.json), [`codex/wozcode/.codex-plugin/plugin.json:2-10`](../../codex/wozcode/.codex-plugin/plugin.json)) | Host behavior and safety guidance can drift |
| Telemetry surface | Default-on MCP environment plus hooks after every tool/stop/compact ([`.mcp.json:10-15`](../../.mcp.json), [`hooks/hooks.json:52-113`](../../hooks/hooks.json)) | Broad event collection surface; payload details are opaque |
| Credential handling | Token JSON passed with `--token` ([`skills/woz/SKILL.md:80-97`](../../skills/woz/SKILL.md)) | Shell history/process/transcript exposure |
| Update trust | Mutable marketplace/npm update paths without documented hashes/signatures ([`skills/woz/SKILL.md:182-222`](../../skills/woz/SKILL.md), [`codex/wozcode/skills/woz-update/SKILL.md:7-15`](../../codex/wozcode/skills/woz-update/SKILL.md)) | Mispublication or channel compromise reaches executable code |
| Verification | No first-party scripts/CI/lockfile/SBOM/checksum manifest ([`package.json:1-3`](../../package.json)) | Weak reproducibility and vulnerability-response evidence |
| License | Proprietary, Terms-of-Service-bound distribution ([`LICENSE:1`](../../LICENSE)) | Source/audit expectations differ from an open-source repo |

## Inferred risks

- Broad hooks plus remote-default knowledge/feedback features may cross sensitive metadata or code boundaries; exact capture and retention remain unknown.
- Vendored native/WASM/browser assets without visible attestations weaken supply-chain verification.
- The older Codex benchmark's hard-reset workflow can destroy work if its clean-tree precondition is bypassed or races with edits ([`codex/wozcode/skills/woz-benchmark/SKILL.md:60-68`](../../codex/wozcode/skills/woz-benchmark/SKILL.md)).
- A wildcard `Bash(node *)` frequent-path permission is broader than the skill's “least privilege” narrative; actual host enforcement is **UNVERIFIED** ([`skills/woz/SKILL.md:1-6`](../../skills/woz/SKILL.md), [`skills/woz/SKILL.md:28`](../../skills/woz/SKILL.md)).

## Open, unverified items

1. Authoritative source repository and exact source revision for each bundled file.
2. Reproducible build, signing, checksums, SBOM, and vulnerability-scanning pipeline.
3. Credential storage/encryption and token revocation/rotation behavior.
4. Telemetry schemas, redaction, prompt/file-content policy, retention, and opt-out verification.
5. KB tenancy, retention, filtering, and deletion controls.
6. Whether Codex hook discovery is automatic despite not being declared in its manifest.
7. Whether every committed native/WASM artifact is verified before load.

## DeepWiki limitations

- Mode A uses simulated retrieval rather than embeddings/FAISS; no persistent index exists.
- Runtime probing was limited to harmless MCP initialization and tool listing; no auth, write, database, update, reviewer, or network flow was executed.
- Generated bundles were not deobfuscated exhaustively. Claims about internal algorithms remain **UNVERIFIED** unless surfaced through a manifest, skill, config, or runtime schema.
- Vendored dependencies, binary internals, and every generated chunk were intentionally not scanned line-by-line.

## Evidence

- `servers/code-server.js:3` — opaque primary runtime.
- `.mcp.json:10-15`, `hooks/hooks.json:52-113` — telemetry surface.
- `skills/woz/SKILL.md:80-97,182-222` — token/update paths.
- `package.json:1-3` — absent build/test metadata.

## Related

[Overview](overview.md) · [Configuration, auth, and telemetry](configuration-auth-telemetry.md) · [Testing and operations](testing-operations.md)
