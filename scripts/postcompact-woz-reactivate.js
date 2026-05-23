#!/usr/bin/env node
// PostCompact re-activation reminder for WOZCODE.
//
// After Claude Code compacts the conversation, the model can lose awareness
// that WOZCODE's MCP tools are active and silently fall back to the built-in
// Read/Edit/Grep/Glob tools for the rest of the session. That regression
// invisibly burns tokens that WOZCODE's Search/Edit/Sql were saving.
//
// This hook emits a short re-activation message as additionalContext so the
// model sees the reminder immediately after compaction.

const REACTIVATION_MESSAGE = [
  'WOZCODE active — token-saving tools remain available after compaction.',
  '',
  'Use these for file work, not the built-in equivalents:',
  '  • mcp__plugin_woz_code__Search  (instead of Read / Grep / Glob)',
  '  • mcp__plugin_woz_code__Edit    (instead of Edit / Write / NotebookEdit)',
  '  • mcp__plugin_woz_code__Sql     (for DB schema/queries)',
  '',
  'Prefer one combined Search call (globs + content_regex, output_mode="file_paths_with_content") over a Read-after-Grep sequence. Batch multiple edits across files into a single Edit call.',
].join('\n');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

async function main() {
  // Drain stdin so Claude Code's hook protocol doesn't block on a closed pipe.
  await readStdin();

  const payload = {
    hookSpecificOutput: {
      hookEventName: 'PostCompact',
      additionalContext: REACTIVATION_MESSAGE,
    },
  };

  process.stdout.write(JSON.stringify(payload));
}

main().catch(() => {
  // Fail open — never block the session on a reminder hook.
  process.exit(0);
});
