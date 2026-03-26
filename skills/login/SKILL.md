---
name: login
description: Authenticate with the Woz service. Use when the user needs to log in or when authentication is required.
allowed-tools: Bash(node *)
---

# Woz Login Flow

If the user passed `--token <token-json>` as arguments, skip directly to the Token Login section below.

## Browser Login (Preferred)

Run the Woz authentication flow. This opens a browser for the user to log in:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js login
```

If the command exits with code 0, login succeeded — confirm to the user.

## Token Login

Use this when:
- The user passed `--token <token-json>` as arguments to this skill
- The browser login above timed out or failed and the user provides a token

If the browser login failed:
1. The auth URL is visible in the output above
2. Tell the user to open that URL in their browser and complete the login
3. Ask the user to copy the token JSON shown on the auth page after login

Once you have the token JSON (from args or from the user), run:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/wozcode-cli.js login --token '<token-json>'
```

Replace `<token-json>` with the actual JSON.

Confirm success or relay any error to the user.
