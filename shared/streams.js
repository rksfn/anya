(function (root) {
  "use strict";

  const STREAM_HINTS = [
    "/backend-api/conversation",
    "/backend-api/f/conversation",
    "/api/organizations",
    "/api/messages",
    "streamgenerate",
    "/rest/app-chat",
    "/rest/chat",
    "/i/grok",
    "/rest/sse/perplexity_ask",
    "/rest/sse/perplexity.ask"
  ];

  function looksLikeChatStream(url, contentType) {
    const href = String(url || "").toLowerCase();
    const type = String(contentType || "").toLowerCase();
    if (type.includes("text/event-stream") || type.includes("application/x-ndjson")) return true;

    let haystack = href;
    try {
      const parsed = new URL(href);
      haystack = `${parsed.pathname}${parsed.search}`.toLowerCase();
    } catch (_error) {
      // Relative or invalid URLs still match against the raw string.
    }

    return STREAM_HINTS.some((hint) => haystack.includes(hint));
  }

  root.AINeedsAttention = root.AINeedsAttention || {};
  root.AINeedsAttention.STREAM_HINTS = STREAM_HINTS;
  root.AINeedsAttention.looksLikeChatStream = looksLikeChatStream;
})(globalThis);
