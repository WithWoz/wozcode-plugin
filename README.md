# wozcode-plugin

WozCode enhanced coding tools for Claude Code — smart search, batch editing, SQL introspection, and cost-optimized subagent delegation.

## Installation

### From GitHub

Add the marketplace and install:

```shell
/plugin marketplace add WithWoz/wozcode-plugin
/plugin install woz@wozcode-marketplace
```

### From a local path

If you've cloned the repo locally:

```shell
/plugin marketplace add ./path/to/wozcode-plugin
/plugin install woz@wozcode-marketplace
```

### From a Git URL (GitLab, Bitbucket, self-hosted)

```shell
/plugin marketplace add https://gitlab.com/WithWoz/wozcode-plugin.git
/plugin install woz@wozcode-marketplace
```

## What's included

- **MCP Servers** — `WozSearch`, `WozEdit`, `WozBash`, `WozSql`
- **Agents** — `wozcode` (main), `woz-plan` (architecture), `woz-explore` (codebase exploration)
- **Hooks** — compile loop detection, edit batching nudges

## Managing the plugin

```shell
/plugin disable woz@wozcode-marketplace   # disable
/plugin enable woz@wozcode-marketplace    # re-enable
/plugin uninstall woz@wozcode-marketplace # remove
/plugin marketplace remove wozcode-marketplace # remove marketplace
```
