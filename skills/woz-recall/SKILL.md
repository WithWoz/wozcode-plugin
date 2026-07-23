---
name: woz-recall
description: "Search past Claude Code sessions to recall commands, solutions, and context from prior conversations. TRIGGER on 'remember when', 'last time', 'we did this before', 'how did we', or /woz-recall."
argument-hint: what to recall (e.g. "that deploy command")
arguments: query
---

# Session Recall

Spawn the **recall** subagent (`Task` tool, `subagent_type: recall`), passing the user's recall request verbatim — even when vague.

```
Task({ subagent_type: "recall", prompt: "$ARGUMENTS" })
```

Relay the subagent's answer: present the actionable item (command, decision, solution) with its short cite; don't re-summarize.
