import { runScrapeCycle } from './worker.js';

// CLI entry: `npm run fetch` — run one scrape cycle and print a summary.
runScrapeCycle()
  .then((summary) => {
    console.log('[fetch] cycle complete');
    console.log(`  fetched: ${summary.totalFetched}`);
    console.log(`  inserted: ${summary.totalInserted}`);
    console.log(`  duplicates: ${summary.totalDuplicates}`);
    for (const s of summary.sources) {
      const err = s.error ? `  [error: ${s.error}]` : '';
      console.log(`  - ${s.sourceName}: fetched=${s.fetched} inserted=${s.inserted} dup=${s.duplicated}${err}`);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error('[fetch] failed', e);
    process.exit(1);
  });
