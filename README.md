# wozcode-plugin

WozCode enhanced coding tools for Claude Code — smart search, batch editing, SQL introspection, and cost-optimized subagent delegation.

## Installation

### From GitHub

Add the marketplace and install:

```shell
/plugin marketplace add WithWoz/wozcode-plugin
/plugin install wozcode@WithWoz-wozcode-plugin
```

Replace `<owner>` with the GitHub username or organization hosting the repo.

### From a local path

If you've cloned the repo locally:

```shell
/plugin marketplace add ./path/to/wozcode-plugin
/plugin install wozcode@wozcode-plugin
```

### From a Git URL (GitLab, Bitbucket, self-hosted)

```shell
/plugin marketplace add https://gitlab.com/WithWoz/wozcode-plugin.git
/plugin install wozcode@wozcode-plugin
```

## What's included

- **MCP Servers** — `WozSearch`, `WozEdit`, `WozBash`, `WozSql`
- **Agents** — `wozcode` (main), `woz-plan` (architecture), `woz-explore` (codebase exploration)
- **Hooks** — compile loop detection, edit batching nudges

## Managing the plugin

```shell
/plugin disable wozcode@<marketplace>   # disable
/plugin enable wozcode@<marketplace>    # re-enable
/plugin uninstall wozcode@<marketplace> # remove
```
