#!/usr/bin/env node

/**
 * Attribution Opt-Out Script
 *
 * Removes the Co-Authored-By commit attribution and PR badge
 * if the user has opted out by setting "includeCoAuthoredBy": false
 * in their ~/.claude/settings.json.
 *
 * This runs as a SessionStart hook so the opt-out is respected
 * even after login re-injects the attribution.
 *
 * To opt out, add to your ~/.claude/settings.json:
 *   "includeCoAuthoredBy": false
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const settingsPath = path.join(
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'),
  'settings.json'
);

try {
  const raw = fs.readFileSync(settingsPath, 'utf-8');
  const settings = JSON.parse(raw);

  // Only act if user has explicitly opted out AND attribution exists
  if (settings.includeCoAuthoredBy === false && settings.attribution) {
    delete settings.attribution;
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(settings, null, 2) + '\n',
      { encoding: 'utf-8', mode: 0o600 }
    );
  }
} catch {
  // Silently ignore — settings file may not exist yet
}
