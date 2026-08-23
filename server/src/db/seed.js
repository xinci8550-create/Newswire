import getDb from './database.js';
import { NEWS_SOURCES } from '../scraper/sources.js';
import { classify } from '../scraper/classify.js';
import { fingerprint } from '../utils/text.js';
import { upsertArticle } from '../models/articles.js';
import { createSource, listSources } from '../models/sources.js';

/**
 * Seed the sources table with the built-in news sources (idempotent).
 * With `--demo` also inserts sample articles so the UI/API can be validated
 * without live network access (useful in offline/sandbox dev).
 */
async function seedSources() {
  const existing = await listSources({});
  const byFeed = new Map(existing.map((s) => [s.feed_url, s]));
  let created = 0;
  let updated = 0;
  for (const s of NEWS_SOURCES) {
    if (byFeed.has(s.feed_url)) {
      const cur = byFeed.get(s.feed_url);
      const row = await getDb().get('SELECT id FROM sources WHERE id = ?', [cur.id]);
      if (row && (cur.name !== s.name || cur.url !== s.url || Number(cur.enabled) !== s.enabled)) {
        await getDb().run('UPDATE sources SET name = ?, url = ?, enabled = ? WHERE id = ?', [
          s.name, s.url, s.enabled, cur.id,
        ]);
        updated += 1;
      }
    } else {
      await createSource(s);
      created += 1;
    }
  }
  console.log(`[seed] sources: ${created} created, ${updated} updated (${NEWS_SOURCES.length} total)`);
}

const DEMO_ARTICLES = [
  { title: 'OpenAI unveils next-generation reasoning model for developers', summary: 'The new model is said to be more efficient and reliable for complex, multi-step coding and analysis tasks.', category: 'AI' },
  { title: 'Chipmakers race to meet surging demand for AI accelerators', summary: 'Semiconductor giants are expanding capacity as cloud providers order record volumes of AI training chips.', category: 'Tech' },
  { title: 'Markets rally after central bank signals a pause on rate hikes', summary: 'Equities climbed as investors welcomed guidance that borrowing costs may have peaked.', category: 'Finance' },
  { title: 'Lawmakers reach tentative deal to avoid a government shutdown', summary: 'Negotiators agreed on a short-term spending package ahead of the deadline.', category: 'Politics' },
  { title: 'Retail giant beats quarterly earnings expectations', summary: 'Strong online sales and cost controls boosted profits, the company said.', category: 'Business' },
  { title: 'Champions reveal title-winning season in gripping final match', summary: 'A dramatic last-minute goal sealed the championship in front of a record crowd.', category: 'Other' },
  { title: 'Streaming series breaks viewership records over premiere weekend', summary: 'The fantasy drama drew a massive audience, setting a new franchise milestone.', category: 'Entertainment' },
  { title: 'New battery tech promises faster charging and longer range', summary: 'Researchers demonstrated a solid-state design that could transform electric vehicles.', category: 'Tech' },
  { title: 'AI regulation bill advances in the Senate committee', summary: 'The proposal aims to set transparency requirements for high-risk algorithms.', category: 'Politics' },
  { title: 'Global shipping rates fall as supply chain pressures ease', summary: 'Container costs dropped to their lowest level in two years, easing inflation worries.', category: 'Business' },
  { title: 'Energy prices steady as investors weigh geopolitical risk', summary: 'Oil held near recent levels amid mixed signals from major producers.', category: 'Finance' },
  { title: 'Film festival lineup reveals award-season favorites', summary: 'Critics praised several titles heading into the awards circuit.', category: 'Entertainment' },
];

async function seedDemo() {
  const sources = await listSources({ enabledOnly: true });
  if (!sources.length) {
    console.log('[seed:demo] no sources available; run seed first');
    return;
  }
  let inserted = 0;
  let dup = 0;
  const now = Date.now();
  for (let i = 0; i < DEMO_ARTICLES.length; i++) {
    const d = DEMO_ARTICLES[i];
    const source = sources[i % sources.length];
    const url = `https://demo.example/articles/${i + 1}-${d.title.toLowerCase().replace(/[^\w]+/g, '-').slice(0, 40)}`;
    const publishedAt = now - (i + 1) * 7 * 60 * 1000; // spaced out ~7 min apart
    const { category } = classify(d.title, d.summary);
    const res = await upsertArticle({
      sourceId: source.id,
      title: d.title,
      summary: d.summary,
      url,
      imageUrl: null,
      publishedAt,
      category: category === 'Other' ? d.category : category,
      fetchedAt: now,
      fingerprint: fingerprint(d.title),
    });
    if (res.inserted) inserted += 1;
    else dup += 1;
  }
  console.log(`[seed:demo] inserted ${inserted}, duplicates ${dup}`);
}

async function main() {
  await seedSources();
  if (process.argv.includes('--demo')) await seedDemo();
  await getDb().close();
  process.exit(0);
}

main().catch((e) => {
  console.error('[seed] failed', e);
  process.exit(1);
});
