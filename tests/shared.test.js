const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../shared/providers.js");
require("../shared/classifier.js");

const { classifyInputRequest, resolveProvider } = globalThis.AINeedsAttention;

test("resolves every supported provider and limits Grok on x.com", () => {
  assert.equal(resolveProvider("chatgpt.com", "/c/123").id, "chatgpt");
  assert.equal(resolveProvider("chat.openai.com", "/c/123").id, "chatgpt");
  assert.equal(resolveProvider("claude.ai", "/chat/123").id, "claude");
  assert.equal(resolveProvider("gemini.google.com", "/app/123").id, "gemini");
  assert.equal(resolveProvider("grok.com", "/c/123").id, "grok");
  assert.equal(resolveProvider("x.com", "/i/grok/123").id, "grok");
  assert.equal(resolveProvider("x.com", "/home"), null);
  assert.equal(resolveProvider("perplexity.ai", "/search/abc").id, "perplexity");
  assert.equal(resolveProvider("www.perplexity.ai", "/search/abc").id, "perplexity");
});

test("classifies explicit requests for user input", () => {
  assert.deepEqual(
    classifyInputRequest("I can continue after one detail. Please choose an option."),
    { needsInput: true, reason: "explicit-request" }
  );
  assert.equal(classifyInputRequest("Which option would you prefer?").needsInput, true);
  assert.equal(classifyInputRequest("Before I proceed, I need your confirmation.").needsInput, true);
});

test("classifies direct closing questions", () => {
  assert.deepEqual(
    classifyInputRequest("The setup is ready. Would you like me to continue?"),
    { needsInput: true, reason: "closing-question" }
  );
});

test("does not treat ordinary completions as input requests", () => {
  assert.deepEqual(
    classifyInputRequest("The extension is installed and ready to use."),
    { needsInput: false, reason: "completion" }
  );
  assert.deepEqual(
    classifyInputRequest("That covers the setup. Hope that helps!"),
    { needsInput: false, reason: "completion" }
  );
  assert.equal(classifyInputRequest("Does that make sense?").needsInput, false);
});

test("Grok generation signals do not include page-load busy state", () => {
  const grok = globalThis.AINeedsAttention.providers.find((provider) => provider.id === "grok");
  assert.equal(
    grok.generatingSelectors.some((selector) => selector.includes("aria-busy")),
    false
  );
  assert.equal(
    grok.generatingSelectors.some((selector) => selector.includes("Stop")),
    true
  );
});

test("Perplexity generation signals use stop controls rather than busy state", () => {
  const perplexity = globalThis.AINeedsAttention.providers.find((provider) => provider.id === "perplexity");
  assert.equal(
    perplexity.generatingSelectors.some((selector) => selector.includes("aria-busy")),
    false
  );
  assert.equal(
    perplexity.assistantSelectors.some((selector) => selector.includes("markdown-content")),
    true
  );
  assert.equal(
    perplexity.generatingSelectors.some((selector) => selector.includes("Stop")),
    true
  );
});

test("manifest references files that exist", () => {
  const root = path.resolve(__dirname, "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const references = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((entry) => entry.js)
  ];
  for (const reference of references) {
    assert.equal(fs.existsSync(path.join(root, reference)), true, `${reference} should exist`);
  }
});
