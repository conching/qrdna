/**
 * Tell a link-preview crawler apart from someone with a camera.
 *
 * A QR scan is a person pointing a phone at something physical. When a short
 * link is pasted into a chat app, that platform fetches it to build a preview —
 * Slack, iMessage, WhatsApp, Facebook and Twitter all do — and every one of
 * those fetches was landing in `scan_events` as a scan. The noise scales with
 * how much a code gets shared, which is precisely the codes that matter most.
 *
 * Detection is deliberately conservative: a request is only a bot if it says so.
 * Counting a real scan as a preview is worse than the reverse, because the
 * former loses data the customer cares about.
 */

/**
 * Agents that identify themselves outright. Checked first, and as a plain
 * substring, because several do not put a word boundary around the giveaway —
 * `facebookexternalhit` and `Facebot` would both survive a `\bbot\b` test.
 */
const NAMED = [
  // Chat and social preview fetchers
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "slackbot",
  "slack-imgproxy",
  "whatsapp",
  "linkedinbot",
  "discordbot",
  "telegrambot",
  "skypeuripreview",
  "redditbot",
  "pinterest",
  "vkshare",
  "line-podcast",
  "snapchat",
  "signal-desktop",
  // Preview-as-a-service
  "embedly",
  "iframely",
  "quora link preview",
  "nuzzel",
  "outbrain",
  "bitlybot",
  // Search and archive
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "applebot",
  "ia_archiver",
  "ahrefsbot",
  "semrushbot",
  // Monitoring and scripted clients
  "curl/",
  "wget/",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "node-fetch",
  "axios/",
  "okhttp",
  "java/",
  "libwww-perl",
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
  "postmanruntime",
  "insomnia",
  "uptime",
  "pingdom",
  "statuscake",
] as const;

/**
 * Generic fallbacks for agents not on the list.
 *
 * These need boundaries. `Cubot` and `Elephone` are real Android phone brands
 * that appear in genuine user agents — `/bot/i` alone would discard scans from
 * anyone holding a CUBOT handset. The patterns below require the token to be
 * delimited rather than merely present.
 */
const GENERIC = [
  // `bot` needs a boundary in front: CUBOT and Elephone ship real handsets, and
  // "Robot"/"Abbot" turn up in device names. A trailing boundary is not enough.
  /(^|[^a-z])bot([^a-z]|$)/i,

  // These need a boundary behind instead. "SPIDERMAN-A1" is a real phone, so a
  // trailing letter disqualifies — but a leading one does not, because nothing
  // is called a "…crawler" except a crawler.
  /crawler([^a-z]|$)/i,
  /spider([^a-z]|$)/i,
  /scraper([^a-z]|$)/i,
];

// Deliberately not generic patterns:
//   `preview` — Safari Technology Preview is a browser real people use.
//   `fetch`   — too common a substring to risk; node-fetch is named above.

/**
 * True when the request was almost certainly made by software, not a person.
 *
 * A missing user agent counts: every real scanner sends one, and something that
 * withholds it is not a phone camera.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;

  const ua = userAgent.toLowerCase().trim();
  if (!ua) return true;

  if (NAMED.some((needle) => ua.includes(needle))) return true;
  return GENERIC.some((re) => re.test(ua));
}

/** Human-readable source, for showing alongside the count. */
export function describeBot(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown client";
  const ua = userAgent.toLowerCase();

  const labels: Array<[string, string]> = [
    ["facebookexternalhit", "Facebook"],
    ["facebot", "Facebook"],
    ["twitterbot", "X / Twitter"],
    ["slackbot", "Slack"],
    ["slack-imgproxy", "Slack"],
    ["whatsapp", "WhatsApp"],
    ["linkedinbot", "LinkedIn"],
    ["discordbot", "Discord"],
    ["telegrambot", "Telegram"],
    ["skypeuripreview", "Skype"],
    ["redditbot", "Reddit"],
    ["pinterest", "Pinterest"],
    ["googlebot", "Google"],
    ["bingbot", "Bing"],
    ["applebot", "Apple"],
  ];

  for (const [needle, label] of labels) {
    if (ua.includes(needle)) return `${label} link preview`;
  }
  return "Automated client";
}
