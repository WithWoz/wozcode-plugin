---
name: woz-recall
description: "Semantically search past Claude Code sessions to recall commands, solutions, and context from prior conversations. TRIGGER on 'remember when', 'last time', 'we did this before', 'how did we', or /woz-recall."
---

# Session Recall

Use the `Recall` MCP tool to search past sessions semantically:

```
mcp__plugin_woz_code__Recall({ query: "<what the user is looking for>" })
```

Pass the user's query directly — it can be vague ("that deploy command") or specific ("harbor run terminal-bench"). The tool returns ranked results from past conversations with full context.

Present results clearly: show the key information (commands, explanations, solutions) and note when/where it came from. Focus on what's actionable — the user wants the answer, not a summary of metadata.

If the `Recall` tool returns a "disabled" message, recall has been turned off in settings. Tell the user they can re-enable it with `/woz settings` → `recall true` (takes effect immediately).
