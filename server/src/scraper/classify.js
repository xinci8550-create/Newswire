/**
 * Lightweight keyword/rule-based English news classifier.
 * Scores each category by counting keyword hits in the title (weight 2) and
 * summary (weight 1). The highest-scoring category wins; "Other" is the fallback.
 *
 * Categories (canonical keys stored in DB):
 *   AI, Finance, Politics, Tech, Business, Entertainment, Other
 */
export const CATEGORIES = ['AI', 'Finance', 'Politics', 'Tech', 'Business', 'Entertainment', 'Other'];

const KEYWORDS = {
  AI: [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'openai', 'anthropic',
    'chatgpt', 'gpt', 'llm', 'large language model', 'generative ai', 'ai model', 'ai chatbot', 'copilot',
    'deepmind', 'superintelligence', 'ai safety', 'algorithm', 'model training', 'inference', 'diffusion',
    'ai', 'automl', 'computer vision', 'natural language', 'transformer', 'agentic', 'fine-tuning',
    '人工智能', '大模型', '深度学习', '机器学习', '智能体',
  ],
  Finance: [
    'stock', 'stocks', 'market', 'markets', 'wall street', 'nasdaq', 'dow', 's&p', 'fed', 'federal reserve',
    'interest rate', 'inflation', 'bond', 'treasury', 'earnings', 'revenue', 'profit', 'quarterly results',
    'bank', 'banking', 'ipo', 'valuation', 'investor', 'investing', 'investment', 'fund', 'etf', 'crypto',
    'bitcoin', 'ethereum', 'currency', 'forex', 'economy', 'economic', 'gdp', 'recession', 'dow jones',
    '金融', '股票', '通胀', '利率', '美联储', '银行', '比特币', '经济',
  ],
  Politics: [
    'president', 'election', 'vote', 'voter', 'congress', 'senate', 'house', 'parliament', 'prime minister',
    'government', 'policy', 'law', 'legislation', 'bill', 'vote', 'candidate', 'campaign', 'democrat', 'republican',
    'senator', 'governor', 'minister', 'diplomacy', 'sanction', 'tariff', 'nato', 'white house', 'capitol',
    'political', 'politics', 'geopolitics', 'ukraine', 'israel', 'gaza', 'court', 'justice', 'impeachment',
    '政治', '总统', '选举', '政府', '政策', '法案', '国会',
  ],
  Tech: [
    'technology', 'tech', 'software', 'hardware', 'chip', 'chips', 'semiconductor', 'processor', 'gpu', 'cpu',
    'smartphone', 'iphone', 'android', 'apple', 'google', 'microsoft', 'meta', 'amazon', 'facebook', 'tiktok',
    'startup', 'app', 'cloud', 'data', 'cybersecurity', 'hacker', 'hacking', 'breach', 'security', 'privacy',
    'robot', 'robotics', 'drone', 'vr', 'ar', 'metaverse', 'quantum', '5g', 'internet', 'software update',
    '科技', '芯片', '半导体', '软件', '硬件', '苹果', '谷歌', '微软', '初创',
  ],
  Business: [
    'business', 'company', 'ceo', 'executive', 'merger', 'acquisition', 'layoff', 'hiring', 'workforce',
    'retail', 'manufacturing', 'supply chain', 'sales', 'revenue growth', 'small business', 'entrepreneur',
    'corporate', 'deal', 'partnership', 'competitor', 'brand', 'consumer', 'industry', 'trade', 'management',
    '商业', '企业', '并购', '裁员', '零售', '供应链', '品牌',
  ],
  Entertainment: [
    'movie', 'film', 'cinema', 'hollywood', 'box office', 'actor', 'actress', 'award', 'oscar', 'emmy',
    'grammy', 'album', 'music', 'singer', 'concert', 'television', 'tv', 'streaming', 'netflix', 'disney',
    'celebrity', 'star', 'show', 'series', 'premiere', 'game of thrones', 'marvel', 'entertainment',
    '娱乐', '电影', '音乐', '明星', '电视剧', '综艺', '票房',
  ],
};

function countMatches(text, words) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (lower.includes(w)) score += 1;
  }
  return score;
}

/**
 * Classify a title + summary into one of CATEGORIES.
 * @returns { category, scores }
 */
export function classify(title, summary) {
  const text = `${title || ''} ${summary || ''}`.trim();
  const scores = {};
  let best = 'Other';
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    if (cat === 'Other') continue;
    const s = countMatches(title, KEYWORDS[cat]) * 2 + countMatches(summary, KEYWORDS[cat]);
    scores[cat] = s;
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }
  if (bestScore === 0) best = 'Other';
  return { category: best, scores };
}
