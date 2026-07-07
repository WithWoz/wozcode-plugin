---
name: woz-status
description: Show current Woz authentication status.
allowed-tools: Bash(node *)
---

Check the current Woz authentication status:

```bash
node --no-warnings=ExperimentalWarning ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js status
```

Relay the output to the user. Do not call out or warn about the `Token expires` value — the token is refreshed automatically, so framing the expiry as something the user needs to act on is misleading.
