(function (root) {
  "use strict";

  const providers = [
    {
      id: "chatgpt",
      name: "ChatGPT",
      hosts: ["chatgpt.com", "chat.openai.com"],
      assistantSelectors: [
        "[data-message-author-role='assistant']",
        "[data-role='assistant']",
        "[data-message-author='assistant']",
        ".agent-turn"
      ],
      generatingSelectors: [
        "[data-testid='stop-button']",
        "button[aria-label='Stop generating']",
        "button[aria-label='Stop streaming']",
        "[data-testid='thinking-indicator']"
      ],
      generatingLabels: ["stop generating", "stop streaming"]
    },
    {
      id: "claude",
      name: "Claude",
      hosts: ["claude.ai"],
      assistantSelectors: [
        ".font-claude-response",
        "[data-testid='ai-message']",
        ".font-claude-message",
        "[data-testid='message-assistant']",
        ".assistant-message"
      ],
      generatingSelectors: [
        "button[aria-label*='Stop']",
        "button[data-testid*='stop']",
        "[data-is-streaming='true']",
        "[aria-busy='true']"
      ],
      generatingLabels: ["stop response", "stop generating"]
    },
    {
      id: "gemini",
      name: "Gemini",
      hosts: ["gemini.google.com"],
      assistantSelectors: [
        "model-response",
        ".model-response",
        "[data-test-id='model-response']",
        ".gemini-response"
      ],
      generatingSelectors: [
        "button[aria-label='Stop response']",
        ".stop-icon",
        "mat-icon[data-mat-icon-name='stop']",
        "mat-icon[data-mat-icon-name='stop_circle']"
      ],
      generatingLabels: ["stop response"]
    },
    {
      id: "grok",
      name: "Grok",
      hosts: ["grok.com", "x.com"],
      pathPrefix: { "x.com": "/i/grok" },
      assistantSelectors: [
        "[data-testid='assistant-message']",
        "[data-role='assistant']",
        "[data-message-author-role='assistant']",
        ".response-content-markdown"
      ],
      generatingSelectors: [
        "button[aria-label='Stop']",
        "button[aria-label*='Stop generating']",
        "button[aria-label*='Stop response']",
        "button[data-testid*='stop']"
      ],
      generatingLabels: ["stop generating", "stop response"]
    },
    {
      id: "perplexity",
      name: "Perplexity",
      hosts: ["perplexity.ai"],
      assistantSelectors: [
        "div[id^='markdown-content-']",
        "[data-testid='answer']",
        "[data-testid='assistant']",
        ".prose.text-pretty",
        ".prose"
      ],
      generatingSelectors: [
        "button[aria-label='Stop generating']",
        "button[aria-label='Stop']",
        "button[aria-label*='Stop generating']",
        "button[aria-label*='Stop response']",
        "button[aria-label*='Stop search']",
        "button[data-testid*='stop']"
      ],
      generatingLabels: ["stop generating", "stop response", "stop search"]
    }
  ];

  function normalizeHost(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "");
  }

  function resolveProvider(hostname, pathname) {
    const host = normalizeHost(hostname);
    const path = pathname || "/";

    return providers.find((provider) => {
      if (!provider.hosts.includes(host)) return false;
      const requiredPath = provider.pathPrefix && provider.pathPrefix[host];
      return !requiredPath || path.startsWith(requiredPath);
    }) || null;
  }

  root.AINeedsAttention = root.AINeedsAttention || {};
  root.AINeedsAttention.providers = providers;
  root.AINeedsAttention.resolveProvider = resolveProvider;
})(globalThis);
