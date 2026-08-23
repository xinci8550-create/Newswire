import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';

// Isolated test database + no scheduler.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.SQLITE_PATH = `./data/test-${process.pid}.sqlite`;
process.env.ENABLE_IN_PROCESS_CRON = 'false';

const { ensureSchema } = await import('../src/db/migrate.js');
const { createApp } = await import('../src/app.js');
const { getDb } = await import('../src/db/database.js');
const { createSource } = await import('../src/models/sources.js');
const { upsertArticle } = await import('../src/models/articles.js');
const { fingerprint } = await import('../src/utils/text.js');
const { classify } = await import('../src/scraper/classify.js');

let server;
let base;

before(async () => {
  await ensureSchema();
  // Seed a source + a couple of articles so the user-flow tests have data.
  const source = await createSource({ name: 'Test Source', url: 'https://test.example', feed_url: 'https://test.example/feed.xml', enabled: 1 });
  const samples = [
    { title: 'OpenAI launches a new AI model for developers', summary: 'The new model improves coding and reasoning tasks.' },
    { title: 'Global markets rally after central bank surprise', summary: 'Equities climbed on the rate decision.' },
    { title: 'Election results change the political landscape', summary: 'Voters turned out in record numbers.' },
  ];
  const now = Date.now();
  for (let i = 0; i < samples.length; i++) {
    const { category } = classify(samples[i].title, samples[i].summary);
    await upsertArticle({
      sourceId: source.id,
      title: samples[i].title,
      summary: samples[i].summary,
      url: `https://test.example/article/${i + 1}`,
      imageUrl: null,
      publishedAt: now - i * 60000,
      category,
      fetchedAt: now,
      fingerprint: fingerprint(samples[i].title),
    });
  }

  const app = createApp();
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await getDb().close();
});

async function jfetch(path, { method = 'GET', token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

test('health & categories are reachable', async () => {
  const h = await jfetch('/api/health');
  assert.equal(h.status, 200);
  assert.equal(h.json.ok, true);

  const c = await jfetch('/api/categories');
  assert.equal(c.status, 200);
  assert.ok(Array.isArray(c.json.categories));
});

test('articles list & search work', async () => {
  const list = await jfetch('/api/articles?limit=5');
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.json.articles));
  assert.ok(list.json.total >= 0);

  const q = encodeURIComponent('AI');
  const search = await jfetch(`/api/articles?q=${q}&limit=25`);
  assert.equal(search.status, 200);
  assert.ok(Array.isArray(search.json.articles));
});

test('register -> login -> me -> refresh', async () => {
  const email = `u${randomUUID().slice(0, 8)}@example.com`;
  const password = 'password123';

  const reg = await jfetch('/api/auth/register', { method: 'POST', body: { email, password } });
  assert.equal(reg.status, 201, JSON.stringify(reg.json));
  assert.ok(reg.json.accessToken && reg.json.refreshToken && reg.json.user.email === email);

  const me = await jfetch('/api/auth/me', { token: reg.json.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.json.user.email, email);

  const refresh = await jfetch('/api/auth/refresh', { method: 'POST', body: { refreshToken: reg.json.refreshToken } });
  assert.equal(refresh.status, 200);
  assert.ok(refresh.json.accessToken && refresh.json.refreshToken);

  // duplicate register rejected
  const dup = await jfetch('/api/auth/register', { method: 'POST', body: { email, password } });
  assert.equal(dup.status, 409);

  // valid login
  const login = await jfetch('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  assert.ok(login.json.accessToken);

  // bad login rejected
  const bad = await jfetch('/api/auth/login', { method: 'POST', body: { email, password: 'wrongpass123' } });
  assert.equal(bad.status, 401);
});

test('favorite add/list/remove and history view/clear', async () => {
  const email = `u${randomUUID().slice(0, 8)}@example.com`;
  const password = 'password123';
  const reg = await jfetch('/api/auth/register', { method: 'POST', body: { email, password } });
  const token = reg.json.accessToken;

  const list = await jfetch('/api/articles?limit=1');
  assert.ok(list.json.articles.length > 0, 'expected at least one article');
  const article = list.json.articles[0];

  // unauthorized favorite rejected
  const noAuth = await jfetch(`/api/favorites/${article.id}`, { method: 'POST' });
  assert.equal(noAuth.status, 401);

  // add favorite
  const add = await jfetch(`/api/favorites/${article.id}`, { method: 'POST', token });
  assert.equal(add.status, 200);

  // list includes it
  const favs = await jfetch('/api/favorites', { token });
  assert.ok(favs.json.articles.some((a) => a.id === article.id));

  // record a view + history
  const view = await jfetch(`/api/articles/${article.id}/view`, { method: 'POST', token });
  assert.equal(view.status, 200);
  const hist = await jfetch('/api/history', { token });
  assert.ok(hist.json.articles.some((a) => a.id === article.id));

  // remove favorite
  const rem = await jfetch(`/api/favorites/${article.id}`, { method: 'DELETE', token });
  assert.equal(rem.status, 200);
  const favs2 = await jfetch('/api/favorites', { token });
  assert.ok(!favs2.json.articles.some((a) => a.id === article.id));

  // clear history
  const clr = await jfetch('/api/history', { method: 'DELETE', token });
  assert.equal(clr.status, 200);
  const hist2 = await jfetch('/api/history', { token });
  assert.equal(hist2.json.articles.length, 0);
});

test('detail endpoint + category correction (auth)', async () => {
  const list = await jfetch('/api/articles?limit=1');
  const article = list.json.articles[0];
  const det = await jfetch(`/api/articles/${article.id}`);
  assert.equal(det.status, 200);
  assert.ok(det.json.article.title);

  const cat = await jfetch(`/api/articles/${article.id}/category`, {
    method: 'PATCH',
    token: null,
    body: { category: 'Tech' },
  });
  // correction is authenticated
  assert.equal(cat.status, 401);
});
