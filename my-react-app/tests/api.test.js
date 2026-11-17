import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const example = {
  description: 'Groceries',
  category: 'Food',
  amount: 12.34,
  date: '2024-02-29',
  type: 'Expense',
};

// Exercise the real server entrypoint with a separate database for each test.
async function startApi(t, existingPath) {
  const directory = await mkdtemp(join(tmpdir(), 'tracker-api-test-'));
  const databasePath = existingPath ?? join(directory, 'transactions.sqlite');
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0', TRACKER_DB_PATH: databasePath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let diagnostics = '';
  child.stderr.on('data', chunk => { diagnostics += chunk.toString(); });

  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }

  t.after(async () => {
    await stop();
    await rm(directory, { recursive: true, force: true });
  });

  const origin = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`API startup timed out. ${diagnostics}`)), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`API exited with code ${code}. ${diagnostics}`));
    });
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      const address = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (address) { clearTimeout(timer); resolve(address); }
    });
  });

  async function request(method, path = '', body) {
    return fetch(`${origin}/api/transactions${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  }

  return { origin, databasePath, request, stop };
}

test('GET starts with an empty transaction list', async t => {
  const api = await startApi(t);
  const response = await api.request('GET');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), []);
});

test('POST trims fields, generates the ID and provides a readable Location', async t => {
  const api = await startApi(t);
  const response = await api.request('POST', '', {
    ...example, id: 999, description: ' Groceries ', category: ' Food ',
  });
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.deepEqual(saved, { id: 1, ...example });
  assert.equal(response.headers.get('location'), '/api/transactions/1');
  assert.deepEqual(await (await api.request('GET', '/1')).json(), saved);
  assert.deepEqual(await (await api.request('GET')).json(), [saved]);
});

test('PUT preserves identity and failed updates preserve the saved record', async t => {
  const api = await startApi(t);
  await api.request('POST', '', example);
  const replacement = { ...example, description: 'Pay', category: 'Work', amount: 2500, type: 'Income' };
  const response = await api.request('PUT', '/1', replacement);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 1, ...replacement });
  assert.equal((await api.request('PUT', '/1', { ...example, amount: -1 })).status, 400);
  assert.equal((await api.request('PUT', '/1', { description: 'Incomplete' })).status, 400);
  assert.deepEqual(await (await api.request('GET', '/1')).json(), { id: 1, ...replacement });
});

test('DELETE has an empty 204 response and IDs are not reused', async t => {
  const api = await startApi(t);
  await api.request('POST', '', example);
  const response = await api.request('DELETE', '/1');
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal((await api.request('DELETE', '/1')).status, 404);
  assert.deepEqual(await (await api.request('GET')).json(), []);
  assert.equal((await (await api.request('POST', '', example)).json()).id, 2);
});

test('invalid transaction payloads return 400 without writing rows', async t => {
  const api = await startApi(t);
  const cases = [
    ['missing fields', {}],
    ['null', null],
    ['array', []],
    ['blank description', { ...example, description: '   ' }],
    ['non-string description', { ...example, description: 12 }],
    ['blank category', { ...example, category: '' }],
    ['zero amount', { ...example, amount: 0 }],
    ['negative amount', { ...example, amount: -1 }],
    ['string amount', { ...example, amount: '12.34' }],
    ['fractional cents', { ...example, amount: 1.001 }],
    ['unsafe cents', { ...example, amount: 1e20 }],
    ['invalid type', { ...example, type: 'expense' }],
    ['impossible date', { ...example, date: '2026-02-30' }],
    ['non-leap date', { ...example, date: '1900-02-29' }],
    ['timestamp instead of calendar date', { ...example, date: '2026-11-15T00:00:00Z' }],
  ];
  for (const [name, payload] of cases) {
    await t.test(name, async () => {
      const response = await api.request('POST', '', payload);
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, 'string');
    });
  }
  assert.deepEqual(await (await api.request('GET')).json(), []);
});

test('malformed JSON and oversized bodies return JSON errors and the server recovers', async t => {
  const api = await startApi(t);
  const malformed = await fetch(`${api.origin}/api/transactions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, 'Request body must be valid JSON.');
  const oversized = await api.request('POST', '', { ...example, description: 'x'.repeat(17000) });
  assert.equal(oversized.status, 413);
  assert.equal(typeof (await oversized.json()).error, 'string');
  assert.equal((await api.request('POST', '', example)).status, 201);
});

test('invalid IDs, including malformed URL escapes, return 400', async t => {
  const api = await startApi(t);
  for (const id of ['0', '-1', '1.5', 'abc', '01', '1e2', '9007199254740992', '%E0%A4%A']) {
    const response = await api.request('GET', `/${id}`);
    assert.equal(response.status, 400, `Invalid ID ${id}`);
    assert.equal(typeof (await response.json()).error, 'string');
  }
});

test('missing records and unknown API routes return JSON 404 responses', async t => {
  const api = await startApi(t);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await api.request(method, '/99', method === 'PUT' ? example : undefined);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, 'Transaction not found.');
  }
  const unknown = await fetch(`${api.origin}/api/unknown`);
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).error, 'Route not found.');
});

test('bound SQL values keep quoted descriptions as data', async t => {
  const api = await startApi(t);
  const description = "Lunch'); DROP TABLE transactions; --";
  assert.equal((await api.request('POST', '', { ...example, description })).status, 201);
  assert.equal((await (await api.request('GET', '/1')).json()).description, description);
  assert.equal((await api.request('POST', '', example)).status, 201);
  assert.equal((await (await api.request('GET')).json()).length, 2);
});

test('concurrent creates retain every row with unique IDs', async t => {
  const api = await startApi(t);
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => (
    api.request('POST', '', { ...example, description: `Transaction ${index}` })
  )));
  for (const response of responses) assert.equal(response.status, 201);
  const records = await Promise.all(responses.map(response => response.json()));
  assert.equal(new Set(records.map(record => record.id)).size, 12);
  assert.equal((await (await api.request('GET')).json()).length, 12);
});

test('SQLite preserves updates, deletions and cent amounts across server restarts', async t => {
  const first = await startApi(t);
  await first.request('POST', '', example);
  const edited = { ...example, amount: 0.1, description: 'Updated purchase' };
  await first.request('PUT', '/1', edited);
  await first.stop();

  const second = await startApi(t, first.databasePath);
  assert.deepEqual(await (await second.request('GET')).json(), [{ id: 1, ...edited }]);
  const database = new DatabaseSync(first.databasePath, { readOnly: true });
  try {
    assert.equal(database.prepare('SELECT amount_cents FROM transactions WHERE id = 1').get().amount_cents, 10);
  } finally {
    database.close();
  }
  assert.equal((await second.request('DELETE', '/1')).status, 204);
  await second.stop();

  const third = await startApi(t, first.databasePath);
  assert.deepEqual(await (await third.request('GET')).json(), []);
  assert.equal((await (await third.request('POST', '', example)).json()).id, 2);
});


test('an occupied port reports the startup error without a null-address crash', { timeout: 10000 }, async t => {
  const running = await startApi(t);
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: new URL(running.origin).port, TRACKER_DB_PATH: ':memory:' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  });
  let diagnostics = '';
  child.stderr.on('data', chunk => { diagnostics += chunk.toString(); });
  child.stdout.resume();
  const [code] = await once(child, 'exit');
  assert.equal(code, 1);
  assert.match(diagnostics, /Could not start the transaction API:.*EADDRINUSE/);
  assert.doesNotMatch(diagnostics, /TypeError|reading 'port'/);
});
