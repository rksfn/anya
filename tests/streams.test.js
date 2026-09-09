const test = require("node:test");
const assert = require("node:assert/strict");

require("../shared/streams.js");

const { looksLikeChatStream } = globalThis.AINeedsAttention;

test("does not treat every grok.com request as a chat stream", () => {
  assert.equal(looksLikeChatStream("https://grok.com/", ""), false);
  assert.equal(looksLikeChatStream("https://grok.com/c/123", "application/json"), false);
  assert.equal(looksLikeChatStream("https://grok.com/rest/conversations", "application/json"), false);
});

test("does not treat every perplexity.ai request as a chat stream", () => {
  assert.equal(looksLikeChatStream("https://www.perplexity.ai/", ""), false);
  assert.equal(looksLikeChatStream("https://www.perplexity.ai/search/abc", "application/json"), false);
  assert.equal(looksLikeChatStream("https://www.perplexity.ai/rest/threads/abc", "application/json"), false);
});

test("still matches provider chat stream URLs and event-stream responses", () => {
  assert.equal(looksLikeChatStream("https://grok.com/rest/app-chat", "application/json"), true);
  assert.equal(looksLikeChatStream("https://x.com/i/grok/session", ""), true);
  assert.equal(looksLikeChatStream("https://chatgpt.com/backend-api/conversation", ""), true);
  assert.equal(looksLikeChatStream("https://gemini.google.com/foo", "text/event-stream"), true);
  assert.equal(looksLikeChatStream("https://www.perplexity.ai/rest/sse/perplexity_ask", "application/json"), true);
  assert.equal(looksLikeChatStream("https://www.perplexity.ai/rest/sse/perplexity.ask", ""), true);
});
