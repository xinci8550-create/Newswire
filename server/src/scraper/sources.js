/**
 * News sources to scrape (RSS/Atom preferred). Each entry is inserted into the
 * `sources` table by `npm run seed`. The scraper fetches feeds in parallel and
 * tolerates individual failures so one dead/geo-blocked feed never breaks the
 * whole run.
 *
 * feed_url values are well-known RSS/Atom endpoints. A feed may change its
 * endpoint/format over time; failures are logged and the source is simply
 * skipped that cycle.
 */
export const NEWS_SOURCES = [
  {
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    feed_url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    enabled: 1,
  },
  {
    name: 'The Guardian',
    url: 'https://www.theguardian.com',
    feed_url: 'https://www.theguardian.com/world/rss',
    enabled: 1,
  },
  {
    name: 'The New York Times',
    url: 'https://www.nytimes.com',
    feed_url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    enabled: 1,
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    feed_url: 'https://techcrunch.com/feed/',
    enabled: 1,
  },
  {
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    feed_url: 'https://feeds.arstechnica.com/arstechnica/index',
    enabled: 1,
  },
  {
    name: 'CNBC',
    url: 'https://www.cnbc.com',
    feed_url:
      'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362',
    enabled: 1,
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com',
    feed_url: 'https://www.theverge.com/rss/index.xml',
    enabled: 1,
  },
  {
    name: 'NPR',
    url: 'https://www.npr.org',
    feed_url: 'https://feeds.npr.org/1001/rss.xml',
    enabled: 1,
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com',
    feed_url: 'https://www.wired.com/feed/rss',
    enabled: 1,
  },
  {
    name: 'CBS News',
    url: 'https://www.cbsnews.com',
    feed_url: 'https://www.cbsnews.com/latest/rss',
    enabled: 1,
  },
];
