import { useState } from 'react';
import { ShareIcon } from './Icons';

/** Share the current article: native share sheet when available, else copy link. */
export default function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button className="btn ghost" onClick={share} title="Share this article" aria-label="Share">
      <ShareIcon size={16} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
