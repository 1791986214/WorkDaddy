'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const daemon = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'daemon.js'), 'utf8');
const inject = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'inject.js'), 'utf8');

test('panel token refresh endpoint keeps every backup account alive', () => {
  assert.match(daemon, /async function refreshAllAccountTokensOnPanelOpen\(\)/);
  assert.match(daemon, /refreshAccountBackupToken\(uid, \{ dailyKeepalive: true, force: true \}\)/);
  assert.match(daemon, /options\.force !== true && !dailyDue && !shouldRefreshAccessToken/);
  const routeStart = daemon.indexOf("p === '/api/accounts/refresh-tokens'");
  const routeEnd = daemon.indexOf("if (req.method === 'GET' && p === '/api/accounts')", routeStart);
  assert.ok(routeStart >= 0 && routeEnd > routeStart);
  assert.match(daemon.slice(routeStart, routeEnd), /refreshAllAccountTokensOnPanelOpen\(\)/);
});

test('opening the account panel triggers token refresh and then refreshes its snapshot', () => {
  const start = inject.indexOf('    function setOpen(open, options)');
  const end = inject.indexOf('    function setupFabDrag()', start);
  assert.ok(start >= 0 && end > start);
  const body = inject.slice(start, end);
  assert.match(body, /\/api\/accounts\/refresh-tokens/);
  assert.match(body, /dailyKeepalive|refresh-tokens/);
  assert.match(body, /\.then\(function \(result\)/);
});
