---
name: woz-recall
description: "Search past Claude Code sessions for commands, knowledge, solutions, and context. TRIGGER when: user says \"remember when\", \"we did this before\", \"we've done this\", \"last time we\", \"in a previous session\", \"how did we\", \"what was that command\", \"I remember doing\", \"find that thing from before\", \"we figured out\", \"there was a way to\", or any reference to past work/sessions/conversations. Also trigger on explicit /recall."
---

# Session Recall

Use the `Recall` MCP tool to search past sessions semantically:

```
mcp__plugin_woz_code__Recall({ query: "<what the user is looking for>" })
```

Pass the user's query directly — it can be vague ("that deploy command") or specific ("harbor run terminal-bench"). The tool returns ranked results from past conversations with full context.

Present results clearly: show the key information (commands, explanations, solutions) and note when/where it came from. Focus on what's actionable — the user wants the answer, not a summary of metadata.
