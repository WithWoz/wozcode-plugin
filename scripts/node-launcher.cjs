'use strict';
// The generated launcher stubs' rescue path: re-execs into a supported Node when the spawning interpreter is too old.
// ES5 syntax and core modules only; APIs newer than that parse target must degrade inside a catch rather than throw.

var childProcess = require('child_process');
var crypto = require('crypto');
var fs = require('fs');
var os = require('os');
var path = require('path');

var constants = require('./node-launcher-constants.cjs');
var MIN_NODE_VERSION = constants.MIN_NODE_VERSION;
var TOO_OLD_MESSAGE_TEMPLATE = constants.TOO_OLD_MESSAGE_TEMPLATE;
var VERSION_MANAGER_HINT = constants.VERSION_MANAGER_HINT;
var CURRENT_VERSION_TOKEN = constants.CURRENT_VERSION_TOKEN;
var CLAUDE_CONFIG_DIR_ENV_VAR = constants.CLAUDE_CONFIG_DIR_ENV_VAR;
var CLAUDE_HOME_DIR_NAME = constants.CLAUDE_HOME_DIR_NAME;
var CONFIG_SUBDIR_NAME = constants.CONFIG_SUBDIR_NAME;
var LEGACY_CONFIG_DIR_NAME = constants.LEGACY_CONFIG_DIR_NAME;
var CACHE_FILENAME = constants.CACHE_FILENAME;
var CACHE_VERSION = constants.CACHE_VERSION;
var CACHE_SOURCE = constants.CACHE_SOURCE;
var ENV_SOURCE = constants.ENV_SOURCE;
var FAILURE_FILENAME = constants.FAILURE_FILENAME;
var FAILURE_TTL_MS = constants.FAILURE_TTL_MS;
var NODE_ENV_VAR = constants.NODE_ENV_VAR;
var SOURCE_ENV_VAR = constants.SOURCE_ENV_VAR;
var REEXEC_ENV_VAR = constants.REEXEC_ENV_VAR;
var HOOK_ROLE = constants.HOOK_ROLE;
var RENAME_TRANSIENT_CODES = constants.RENAME_TRANSIENT_CODES;

var VERSION_PROBE_TIMEOUT_MS = 5000;
var LOGIN_SHELL_TIMEOUT_MS = 10000;
var DISCOVERY_BUDGET_MS = 60000;
var VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(-\S*)?/;
var LEADING_V_PATTERN = /^v/;
var SIGNAL_EXIT_CODE_BASE = 128;
var FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];
var MISSING_STAT_TOKEN = '-';
var MARKER_RENAME_MAX_ATTEMPTS = 3;
var MARKER_RENAME_RETRY_WAIT_MS = 5;
var FNM_VERSIONS_DIR_NAME = 'node-versions';
var FNM_INSTALL_DIR_NAME = 'installation';

function parseVersion(value) {
  var match = VERSION_PATTERN.exec(String(value).trim());
  if (match === null) return undefined;
  // Trailing rank: 1 for a release, 0 for a prerelease, so `x.y.z-rc` sorts below `x.y.z`.
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : 0];
}

function compareVersions(left, right) {
  for (var i = 0; i < 4; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

function isSupportedVersion(value) {
  var version = parseVersion(value);
  var minimum = parseVersion(MIN_NODE_VERSION);
  return version !== undefined && minimum !== undefined && compareVersions(version, minimum) >= 0;
}

function isSameDirPath(leftPathAbs, rightPathAbs) {
  var left = path.resolve(leftPathAbs);
  var right = path.resolve(rightPathAbs);
  if (process.platform === 'win32') return left.toLowerCase() === right.toLowerCase();
  return left === right;
}

function pathSegments(nodePathAbs) {
  var segments = nodePathAbs.split(/[\\/]/);
  if (process.platform !== 'win32') return segments;
  for (var i = 0; i < segments.length; i++) segments[i] = segments[i].toLowerCase();
  return segments;
}

function isVersionManagerShimPath(nodePathAbs) {
  var segments = pathSegments(nodePathAbs);
  for (var i = 0; i < segments.length; i++) {
    if (segments[i] === 'shims') return true;
    if (segments[i] === '.volta' && segments[i + 1] === 'bin') return true;
  }
  return isSameDirPath(path.dirname(nodePathAbs), path.join(voltaHomeDirAbs(os.homedir()), 'bin'));
}

function exists(filePathAbs) {
  try {
    return fs.existsSync(filePathAbs);
  } catch (err) {
    return false;
  }
}

function readJsonFile(filePathAbs) {
  try {
    var parsed = JSON.parse(fs.readFileSync(filePathAbs, 'utf8'));
    return parsed !== null && typeof parsed === 'object' ? parsed : undefined;
  } catch (err) {
    return undefined;
  }
}

function readDirEntries(dirPathAbs) {
  try {
    return fs.readdirSync(dirPathAbs);
  } catch (err) {
    return [];
  }
}

function getConfigDirPathAbs() {
  var claudeHome = process.env[CLAUDE_CONFIG_DIR_ENV_VAR] || path.join(os.homedir(), CLAUDE_HOME_DIR_NAME);
  var configDirAbs = path.join(claudeHome, CONFIG_SUBDIR_NAME);
  if (exists(configDirAbs)) return configDirAbs;
  var legacyDirAbs = path.join(os.homedir(), LEGACY_CONFIG_DIR_NAME);
  if (exists(legacyDirAbs)) return legacyDirAbs;
  return configDirAbs;
}

function nodeExecutableName() {
  return process.platform === 'win32' ? 'node.exe' : 'node';
}

function installedNodePath(installDirAbs) {
  return process.platform === 'win32'
    ? path.join(installDirAbs, nodeExecutableName())
    : path.join(installDirAbs, 'bin', nodeExecutableName());
}

function supportedVersionDirsDescending(installsDirAbs) {
  var entries = readDirEntries(installsDirAbs);
  var supported = [];
  for (var i = 0; i < entries.length; i++) {
    if (isSupportedVersion(entries[i])) supported.push(entries[i]);
  }
  supported.sort(function byVersionDescending(left, right) {
    return compareVersions(parseVersion(right), parseVersion(left));
  });
  return supported;
}

function pushCandidate(candidates, source, nodePathAbs) {
  if (nodePathAbs === undefined || nodePathAbs === '') return;
  candidates.push({ source: source, nodePathAbs: nodePathAbs });
}

// `installDirRel` is the segment fnm puts between the version directory and the interpreter.
function pushInstallsDirCandidates(candidates, source, installsDirAbs, installDirRel) {
  var versionDirs = supportedVersionDirsDescending(installsDirAbs);
  for (var i = 0; i < versionDirs.length; i++) {
    var installDirAbs = path.join(installsDirAbs, versionDirs[i]);
    if (installDirRel !== undefined) installDirAbs = path.join(installDirAbs, installDirRel);
    pushCandidate(candidates, source, installedNodePath(installDirAbs));
  }
}

function voltaHomeDirAbs(homeDirAbs) {
  return (
    process.env.VOLTA_HOME ||
    (process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || path.join(homeDirAbs, 'AppData', 'Local'), 'Volta')
      : path.join(homeDirAbs, '.volta'))
  );
}

function voltaImagesDirAbs(homeDirAbs) {
  return path.join(voltaHomeDirAbs(homeDirAbs), 'tools', 'image', 'node');
}

function asdfInstallsDirAbs(homeDirAbs) {
  return path.join(process.env.ASDF_DATA_DIR || path.join(homeDirAbs, '.asdf'), 'installs', 'nodejs');
}

function xdgDataDirAbs(homeDirAbs) {
  return process.env.XDG_DATA_HOME || path.join(homeDirAbs, '.local', 'share');
}

function miseInstallsDirAbs(homeDirAbs) {
  return path.join(process.env.MISE_DATA_DIR || path.join(xdgDataDirAbs(homeDirAbs), 'mise'), 'installs', 'node');
}

// nvm-windows keeps a flat `%NVM_HOME%\v22.11.0\node.exe`; the Unix layout nests the versions under `versions/node`.
function nvmVersionsDirsAbs(homeDirAbs) {
  var dirsAbs = [path.join(process.env.NVM_DIR || path.join(homeDirAbs, '.nvm'), 'versions', 'node')];
  if (process.env.NVM_HOME) dirsAbs.push(process.env.NVM_HOME);
  return dirsAbs;
}

function pushVoltaCandidates(candidates, homeDirAbs) {
  var imagesDirAbs = voltaImagesDirAbs(homeDirAbs);
  var platform = readJsonFile(path.join(voltaHomeDirAbs(homeDirAbs), 'tools', 'user', 'platform.json'));
  if (platform !== undefined && platform.node !== undefined && platform.node !== null) {
    pushCandidate(candidates, 'volta', installedNodePath(path.join(imagesDirAbs, String(platform.node.runtime))));
  }
  pushInstallsDirCandidates(candidates, 'volta', imagesDirAbs);
}

function pushAsdfCandidates(candidates, homeDirAbs) {
  var installsDirAbs = asdfInstallsDirAbs(homeDirAbs);
  var toolVersions;
  try {
    toolVersions = fs.readFileSync(path.join(homeDirAbs, '.tool-versions'), 'utf8');
  } catch (err) {
    toolVersions = '';
  }
  var lines = toolVersions.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var fields = lines[i].split(/\s+/);
    if (fields[0] !== 'nodejs' && fields[0] !== 'node') continue;
    var version = parseVersion(fields[1]);
    if (version === undefined) continue;
    pushCandidate(candidates, 'asdf', installedNodePath(path.join(installsDirAbs, fields[1])));
  }
  pushInstallsDirCandidates(candidates, 'asdf', installsDirAbs);
}

function fnmDirsAbs(homeDirAbs) {
  var dirsAbs = [
    process.env.FNM_DIR,
    path.join(xdgDataDirAbs(homeDirAbs), 'fnm'),
    path.join(homeDirAbs, 'Library', 'Application Support', 'fnm'),
    path.join(process.env.APPDATA || path.join(homeDirAbs, 'AppData', 'Roaming'), 'fnm'),
    path.join(homeDirAbs, '.fnm'),
  ];
  var kept = [];
  for (var i = 0; i < dirsAbs.length; i++) {
    if (dirsAbs[i] === undefined || dirsAbs[i] === '') continue;
    kept.push(dirsAbs[i]);
  }
  return kept;
}

function fnmVersionsDirsAbs(homeDirAbs) {
  var dirsAbs = fnmDirsAbs(homeDirAbs);
  var versionsDirsAbs = [];
  for (var i = 0; i < dirsAbs.length; i++) {
    versionsDirsAbs.push(path.join(dirsAbs[i], FNM_VERSIONS_DIR_NAME));
  }
  return versionsDirsAbs;
}

function pushFnmCandidates(candidates, homeDirAbs) {
  var dirsAbs = fnmDirsAbs(homeDirAbs);
  for (var i = 0; i < dirsAbs.length; i++) {
    pushCandidate(candidates, 'fnm', installedNodePath(path.join(dirsAbs[i], 'aliases', 'default')));
  }
  var versionsDirsAbs = fnmVersionsDirsAbs(homeDirAbs);
  for (var i = 0; i < versionsDirsAbs.length; i++) {
    pushInstallsDirCandidates(candidates, 'fnm', versionsDirsAbs[i], FNM_INSTALL_DIR_NAME);
  }
}

function wellKnownNodePathsAbs(homeDirAbs) {
  return process.platform === 'win32'
    ? [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'),
        path.join(
          process.env.LOCALAPPDATA || path.join(homeDirAbs, 'AppData', 'Local'),
          'Programs',
          'nodejs',
          'node.exe'
        ),
      ]
    : [
        '/opt/homebrew/bin/node',
        '/usr/local/bin/node',
        '/usr/bin/node',
        path.join(homeDirAbs, '.local', 'bin', 'node'),
      ];
}

function pushWellKnownCandidates(candidates, homeDirAbs) {
  var pathsAbs = wellKnownNodePathsAbs(homeDirAbs);
  for (var i = 0; i < pathsAbs.length; i++) {
    pushCandidate(candidates, 'well-known', pathsAbs[i]);
  }
}

function readCachedNodePath() {
  var cache = readJsonFile(path.join(getConfigDirPathAbs(), CACHE_FILENAME));
  if (cache === undefined || cache.version !== CACHE_VERSION) return undefined;
  return typeof cache.nodePathAbs === 'string' ? cache.nodePathAbs : undefined;
}

function collectRecordedCandidates() {
  var candidates = [];
  pushCandidate(candidates, ENV_SOURCE, process.env[NODE_ENV_VAR]);
  pushCandidate(candidates, CACHE_SOURCE, readCachedNodePath());
  return candidates;
}

var cachedScannedCandidates;

function collectScannedCandidates() {
  if (cachedScannedCandidates !== undefined) return cachedScannedCandidates;
  var homeDirAbs = os.homedir();
  var candidates = [];
  pushVoltaCandidates(candidates, homeDirAbs);
  pushAsdfCandidates(candidates, homeDirAbs);
  pushInstallsDirCandidates(candidates, 'mise', miseInstallsDirAbs(homeDirAbs));
  var nvmDirsAbs = nvmVersionsDirsAbs(homeDirAbs);
  for (var i = 0; i < nvmDirsAbs.length; i++) {
    pushInstallsDirCandidates(candidates, 'nvm', nvmDirsAbs[i]);
  }
  pushFnmCandidates(candidates, homeDirAbs);
  pushWellKnownCandidates(candidates, homeDirAbs);
  cachedScannedCandidates = candidates;
  return candidates;
}

// The fingerprint passes no `excludedDirAbs`, and a relative entry is dropped: which process asks must not change it.
function collectPathCandidates(excludedDirAbs) {
  var candidates = [];
  var dirsAbs = (process.env.PATH || '').split(path.delimiter);
  for (var i = 0; i < dirsAbs.length; i++) {
    if (!path.isAbsolute(dirsAbs[i]) || dirsAbs[i] === excludedDirAbs) continue;
    pushCandidate(candidates, 'path', path.join(dirsAbs[i], nodeExecutableName()));
  }
  return candidates;
}

var discoveryDeadline = Date.now() + DISCOVERY_BUDGET_MS;

// A runaway backstop, not a latency cap: it must outlast any scan a loaded machine could still complete.
function discoveryBudgetRemainingMs() {
  return discoveryDeadline - Date.now();
}

function verifyCandidate(candidate) {
  // The Abs suffix is a claim, not a guarantee: the env override, the cache file and the login shell come from outside.
  if (!path.isAbsolute(candidate.nodePathAbs)) return undefined;
  if (isVersionManagerShimPath(candidate.nodePathAbs)) return undefined;
  if (!exists(candidate.nodePathAbs)) return undefined;
  var token = candidateToken(candidate.nodePathAbs);
  if (loadProbeMap(REJECTED_FIELD)[token] !== undefined) return undefined;
  if (discoveryBudgetRemainingMs() < VERSION_PROBE_TIMEOUT_MS) {
    sawTransientFailure = true;
    return undefined;
  }
  var probe = childProcess.spawnSync(candidate.nodePathAbs, ['-v'], {
    encoding: 'utf8',
    timeout: VERSION_PROBE_TIMEOUT_MS,
  });
  if ((probe.error !== undefined && probe.error !== null) || probe.status !== 0) {
    if (isRejectableProbe(probe)) rejectProbe(token);
    var hangRepeated = isTimedOutProbe(probe) && strikeProbeTimeout(token);
    if (isTransientProbe(probe) && !hangRepeated) sawTransientFailure = true;
    return undefined;
  }
  forgetProbeTimeout(token);
  if (typeof probe.stdout !== 'string') return undefined;
  if (!isSupportedVersion(probe.stdout)) {
    rejectProbe(token);
    return undefined;
  }
  return {
    source: candidate.source,
    nodePathAbs: candidate.nodePathAbs,
    // Un-prefixed, like process.versions.node: the canonical cache schema stores it that way.
    nodeVersion: probe.stdout.trim().replace(LEADING_V_PATTERN, ''),
  };
}

// Runs from the home dir, where no project pin applies.
function probeLoginShell() {
  if (process.platform === 'win32') return undefined;
  var shell = process.env.SHELL;
  if (shell === undefined || shell === '') return undefined;
  if (discoveryBudgetRemainingMs() < LOGIN_SHELL_TIMEOUT_MS) {
    sawTransientFailure = true;
    return undefined;
  }
  var probe = childProcess.spawnSync(shell, ['-lc', 'node -p "process.execPath"'], {
    cwd: os.homedir(),
    encoding: 'utf8',
    timeout: LOGIN_SHELL_TIMEOUT_MS,
  });
  if (probe.error !== undefined && probe.error !== null) {
    if (isTransientProbe(probe)) sawTransientFailure = true;
    return undefined;
  }
  if (probe.status !== 0 || typeof probe.stdout !== 'string') return undefined;
  var nodePathAbs = probe.stdout.trim().split('\n').pop();
  if (nodePathAbs === undefined || nodePathAbs === '') return undefined;
  return verifyCandidate({ source: 'login-shell', nodePathAbs: nodePathAbs });
}

function probeLastResort() {
  var found = firstVerifiedCandidate(collectPathCandidates(path.dirname(process.execPath)));
  return found !== undefined ? found : probeLoginShell();
}

function statToken(filePathAbs) {
  try {
    var stat = fs.statSync(filePathAbs);
    // ctime moves for the chmod that repairs an unusable interpreter, which mtime and size both miss.
    return String(stat.mtimeMs) + ':' + String(stat.ctimeMs) + ':' + String(stat.size);
  } catch (err) {
    return MISSING_STAT_TOKEN;
  }
}

var LOGIN_SHELL_STARTUP_FILES_REL = [
  '.profile',
  '.zshenv',
  '.zprofile',
  '.zshrc',
  '.bash_profile',
  '.bash_login',
  '.bashrc',
  path.join('.config', 'fish', 'config.fish'),
];

function loginShellStartupInputs(homeDirAbs) {
  if (process.platform === 'win32') return [];
  var inputs = [];
  for (var i = 0; i < LOGIN_SHELL_STARTUP_FILES_REL.length; i++) {
    var filePathAbs = path.join(homeDirAbs, LOGIN_SHELL_STARTUP_FILES_REL[i]);
    inputs.push(filePathAbs + '=' + statToken(filePathAbs));
  }
  return inputs;
}

function installRootsAbs(homeDirAbs) {
  return [voltaImagesDirAbs(homeDirAbs), asdfInstallsDirAbs(homeDirAbs), miseInstallsDirAbs(homeDirAbs)]
    .concat(nvmVersionsDirsAbs(homeDirAbs))
    .concat(fnmVersionsDirsAbs(homeDirAbs));
}

function realPathAbs(filePathAbs) {
  try {
    return fs.realpathSync(filePathAbs);
  } catch (err) {
    return filePathAbs;
  }
}

function normalizeForRootMatch(filePathAbs) {
  return process.platform === 'win32' ? filePathAbs.toLowerCase() : filePathAbs;
}

// Both sides resolve first: fnm's per-shell bin symlinks into its versions dir, and a symlinked home moves a root.
function normalizedRootPrefixes(rootsAbs) {
  var prefixes = [];
  for (var i = 0; i < rootsAbs.length; i++) {
    if (rootsAbs[i] === '') continue;
    prefixes.push(normalizeForRootMatch(realPathAbs(rootsAbs[i])) + path.sep);
  }
  return prefixes;
}

function isUnderInstallRoot(nodePathAbs, rootPrefixes) {
  var normalized = normalizeForRootMatch(realPathAbs(nodePathAbs));
  for (var i = 0; i < rootPrefixes.length; i++) {
    if (normalized.indexOf(rootPrefixes[i]) === 0) return true;
  }
  return false;
}

// One marker serves every launcher: PATH order must not move the fingerprint, and a root already watches its own.
function reachablePathNodeInputs(rootsAbs) {
  var rootPrefixes = normalizedRootPrefixes(rootsAbs);
  var candidates = collectPathCandidates();
  var inputs = [];
  for (var i = 0; i < candidates.length; i++) {
    var nodePathAbs = candidates[i].nodePathAbs;
    var token = statToken(nodePathAbs);
    if (token === MISSING_STAT_TOKEN) continue;
    if (isUnderInstallRoot(nodePathAbs, rootPrefixes)) continue;
    inputs.push(nodePathAbs + '=' + token);
  }
  return inputs.sort();
}

function candidateToken(nodePathAbs) {
  return nodePathAbs + '=' + statToken(nodePathAbs);
}

function scannedCandidateInputs() {
  var candidates = collectScannedCandidates();
  var inputs = [];
  for (var i = 0; i < candidates.length; i++) {
    inputs.push(candidateToken(candidates[i].nodePathAbs));
  }
  return inputs.sort();
}

var REJECTABLE_PROBE_ERROR_CODES = ['EACCES', 'EPERM', 'ENOEXEC'];

var PROBE_TIMEOUT_ERROR_CODE = 'ETIMEDOUT';

// A machine short of descriptors, process slots, memory or time answers for this run only, never for the whole window.
var TRANSIENT_PROBE_ERROR_CODES = [PROBE_TIMEOUT_ERROR_CODE, 'EAGAIN', 'EMFILE', 'ENFILE', 'ENOMEM'];

var sawTransientFailure = false;

function probeErrorCode(probe) {
  var error = probe.error;
  return error === undefined || error === null ? undefined : error.code;
}

function isRejectableProbe(probe) {
  return REJECTABLE_PROBE_ERROR_CODES.indexOf(probeErrorCode(probe)) !== -1;
}

function isTransientProbe(probe) {
  return TRANSIENT_PROBE_ERROR_CODES.indexOf(probeErrorCode(probe)) !== -1;
}

function isTimedOutProbe(probe) {
  return probeErrorCode(probe) === PROBE_TIMEOUT_ERROR_CODE;
}

var REJECTED_FIELD = 'rejected';
var TIMED_OUT_FIELD = 'timedOut';
var PROBE_MAP_FIELDS = [REJECTED_FIELD, TIMED_OUT_FIELD];

var probeMaps = {};
var probeMapsChanged = false;
var sawCurrentFailureRecord = false;

// Every map comes off one read: the rescue reaches for the second the moment a probe answers.
function readProbeMaps() {
  var record = readMarkerRecord();
  for (var field = 0; field < PROBE_MAP_FIELDS.length; field++) {
    var map = {};
    probeMaps[PROBE_MAP_FIELDS[field]] = map;
    var stored = record === undefined ? undefined : record[PROBE_MAP_FIELDS[field]];
    if (stored === undefined || stored === null || typeof stored !== 'object') continue;
    for (var token in stored) {
      if (!Object.prototype.hasOwnProperty.call(stored, token)) continue;
      if (typeof stored[token] === 'number' && Date.now() - stored[token] < FAILURE_TTL_MS) {
        map[token] = stored[token];
      }
    }
  }
}

function loadProbeMap(field) {
  if (probeMaps[field] === undefined) readProbeMaps();
  return probeMaps[field];
}

function rejectProbe(token) {
  loadProbeMap(REJECTED_FIELD)[token] = Date.now();
  probeMapsChanged = true;
}

function forgetProbeTimeout(token) {
  var timedOut = loadProbeMap(TIMED_OUT_FIELD);
  if (timedOut[token] === undefined) return;
  delete timedOut[token];
  probeMapsChanged = true;
}

// A hang has to repeat before the run stops counting as a busy machine; the candidate itself is never condemned.
function strikeProbeTimeout(token) {
  var timedOut = loadProbeMap(TIMED_OUT_FIELD);
  var repeated = timedOut[token] !== undefined;
  timedOut[token] = Date.now();
  probeMapsChanged = true;
  return repeated;
}

var cachedFingerprint;

// Every place a Node could appear, PATH included: a Node landing on it must retire the marker on every platform.
function discoveryFingerprint() {
  if (cachedFingerprint !== undefined) return cachedFingerprint;
  var homeDirAbs = os.homedir();
  var rootsAbs = installRootsAbs(homeDirAbs);
  var pathsAbs = rootsAbs.concat(wellKnownNodePathsAbs(homeDirAbs));
  var inputs = [process.env.SHELL || '', homeDirAbs, process.platform];
  for (var i = 0; i < pathsAbs.length; i++) {
    inputs.push(pathsAbs[i] + '=' + statToken(pathsAbs[i]));
  }
  inputs = inputs.concat(
    reachablePathNodeInputs(rootsAbs),
    scannedCandidateInputs(),
    loginShellStartupInputs(homeDirAbs)
  );
  cachedFingerprint = crypto.createHash('sha1').update(inputs.join('\n')).digest('hex');
  return cachedFingerprint;
}

// Nothing here may await: the rescue runs to completion before the re-exec, so the wait has to block.
function waitSync(waitInMs) {
  var until = Date.now() + waitInMs;
  while (Date.now() < until) {}
}

function renameReplacingDestSync(fromPathAbs, toPathAbs) {
  for (var attempt = 1; ; attempt++) {
    try {
      fs.renameSync(fromPathAbs, toPathAbs);
      return;
    } catch (err) {
      var code = err === null || err === undefined ? undefined : err.code;
      if (attempt >= MARKER_RENAME_MAX_ATTEMPTS || RENAME_TRANSIENT_CODES.indexOf(code) === -1) throw err;
      waitSync(MARKER_RENAME_RETRY_WAIT_MS);
    }
  }
}

function markerPathAbs() {
  return path.join(getConfigDirPathAbs(), FAILURE_FILENAME);
}

function readMarkerRecord() {
  var record = readJsonFile(markerPathAbs());
  if (record === undefined || record.minNodeVersion !== MIN_NODE_VERSION) return undefined;
  return record;
}

function writeMarker(record) {
  record.minNodeVersion = MIN_NODE_VERSION;
  var targetPathAbs = markerPathAbs();
  // Launchers start concurrently, so a reader must never observe the truncated window an in-place write opens.
  var tempPathAbs = targetPathAbs + '.' + String(process.pid) + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  try {
    fs.mkdirSync(getConfigDirPathAbs(), { recursive: true });
    fs.writeFileSync(tempPathAbs, JSON.stringify(record) + '\n', 'utf8');
    renameReplacingDestSync(tempPathAbs, targetPathAbs);
  } catch (err) {
    // Best effort: a read-only config dir only costs us the repeat-suppression window.
    try {
      fs.unlinkSync(tempPathAbs);
    } catch (cleanupErr) {
      // The write never landed.
    }
  }
}

function dropChangedProbeEntries() {
  var dropped = false;
  for (var field = 0; field < PROBE_MAP_FIELDS.length; field++) {
    var map = loadProbeMap(PROBE_MAP_FIELDS[field]);
    for (var token in map) {
      if (!Object.prototype.hasOwnProperty.call(map, token)) continue;
      var separatorIndex = token.lastIndexOf('=');
      if (separatorIndex <= 0) continue;
      var current = statToken(token.slice(0, separatorIndex));
      if (current === MISSING_STAT_TOKEN) continue;
      if (current === token.slice(separatorIndex + 1)) continue;
      delete map[token];
      probeMapsChanged = true;
      dropped = true;
    }
  }
  return dropped;
}

function withProbeMaps(record) {
  for (var field = 0; field < PROBE_MAP_FIELDS.length; field++) {
    record[PROBE_MAP_FIELDS[field]] = loadProbeMap(PROBE_MAP_FIELDS[field]);
  }
  return record;
}

function isWithinFailureWindow() {
  var record = readMarkerRecord();
  if (record === undefined || typeof record.failedAt !== 'number') return false;
  if (Date.now() - record.failedAt >= FAILURE_TTL_MS) return false;
  if (record.fingerprint !== discoveryFingerprint()) return false;
  sawCurrentFailureRecord = true;
  return !dropChangedProbeEntries();
}

function recordFailure() {
  writeMarker(withProbeMaps({ failedAt: Date.now(), fingerprint: discoveryFingerprint() }));
  probeMapsChanged = false;
}

function persistProbeMaps() {
  if (!probeMapsChanged) return;
  var record = readMarkerRecord();
  if (record === undefined) record = {};
  writeMarker(withProbeMaps(record));
  probeMapsChanged = false;
}

function discardFailureRecord() {
  writeMarker(withProbeMaps({}));
  probeMapsChanged = false;
  sawCurrentFailureRecord = false;
}

function firstVerifiedCandidate(candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var found = verifyCandidate(candidates[i]);
    if (found !== undefined) return found;
  }
  return undefined;
}

// The failure window has to short-circuit after the recorded candidates and before the tree walks.
function discoverSupportedNode() {
  var found = firstVerifiedCandidate(collectRecordedCandidates());
  if (found !== undefined) return found;
  if (isWithinFailureWindow()) return undefined;
  found = firstVerifiedCandidate(collectScannedCandidates());
  if (found !== undefined) return found;
  return probeLastResort();
}

function findSupportedNode() {
  discoveryDeadline = Date.now() + DISCOVERY_BUDGET_MS;
  var found = discoverSupportedNode();
  if (found !== undefined && sawCurrentFailureRecord) discardFailureRecord();
  persistProbeMaps();
  return found;
}

function exitCodeFromChild(code, signal) {
  var signals = os.constants && os.constants.signals;
  if (signal !== null && signal !== undefined) return SIGNAL_EXIT_CODE_BASE + ((signals && signals[signal]) || 0);
  return typeof code === 'number' ? code : 1;
}

function forwardSignal(child, signal) {
  try {
    process.on(signal, function onSignal() {
      try {
        child.kill(signal);
      } catch (err) {
        // Child already exited.
      }
    });
  } catch (err) {
    // Platform cannot listen for this signal.
  }
}

// Asynchronous spawn, not spawnSync: a synchronous parent runs no signal handler, so shutdown never reaches the child.
function reexec(found, role) {
  var env = {};
  for (var key in process.env) {
    if (Object.prototype.hasOwnProperty.call(process.env, key)) env[key] = process.env[key];
  }
  env[NODE_ENV_VAR] = found.nodePathAbs;
  env[SOURCE_ENV_VAR] = found.source;
  env[REEXEC_ENV_VAR] = '1';
  var args = process.execArgv.concat([process.argv[1]], process.argv.slice(2));
  var child = childProcess.spawn(found.nodePathAbs, args, { stdio: 'inherit', env: env });
  for (var i = 0; i < FORWARDED_SIGNALS.length; i++) {
    forwardSignal(child, FORWARDED_SIGNALS[i]);
  }
  child.on('error', function onSpawnFailure() {
    sawTransientFailure = true;
    giveUp(role);
  });
  child.on('exit', function onExit(code, signal) {
    process.exit(exitCodeFromChild(code, signal));
  });
}

function giveUp(role) {
  var suppressed = isWithinFailureWindow();
  if (!suppressed || role !== HOOK_ROLE) {
    process.stderr.write(
      TOO_OLD_MESSAGE_TEMPLATE.replace(CURRENT_VERSION_TOKEN, process.versions.node) +
        '\n' +
        VERSION_MANAGER_HINT +
        '\n'
    );
  }
  if (!suppressed && !sawTransientFailure) recordFailure();
  process.exit(role === HOOK_ROLE ? 0 : 1);
}

function rescueUnsupportedNode(role) {
  if (process.env[REEXEC_ENV_VAR] === undefined) {
    var found = findSupportedNode();
    if (found !== undefined) {
      reexec(found, role);
      return;
    }
  }
  giveUp(role);
}

rescueUnsupportedNode.collectPathCandidates = collectPathCandidates;
rescueUnsupportedNode.collectScannedCandidates = collectScannedCandidates;
rescueUnsupportedNode.exitCodeFromChild = exitCodeFromChild;
rescueUnsupportedNode.findSupportedNode = findSupportedNode;
rescueUnsupportedNode.giveUp = giveUp;
rescueUnsupportedNode.discoveryFingerprint = discoveryFingerprint;
rescueUnsupportedNode.isRejectableProbe = isRejectableProbe;
rescueUnsupportedNode.isTransientProbe = isTransientProbe;
rescueUnsupportedNode.isTimedOutProbe = isTimedOutProbe;
rescueUnsupportedNode.isSupportedVersion = isSupportedVersion;
rescueUnsupportedNode.probeLastResort = probeLastResort;
rescueUnsupportedNode.isVersionManagerShimPath = isVersionManagerShimPath;

module.exports = rescueUnsupportedNode;
