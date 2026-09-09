(function (root) {
  "use strict";

  const REQUEST_PATTERNS = [
    /\b(?:please|could you|can you|would you)\s+(?:choose|select|confirm|provide|share|tell|describe|clarify|answer|upload|paste|send|enter)\b/i,
    /\b(?:which|what)\s+(?:option|approach|direction|version|one)\b/i,
    /\b(?:before (?:i|we) (?:continue|proceed)|i need (?:you|your)|need your (?:input|confirmation|approval))\b/i,
    /\b(?:let me know|tell me)\s+(?:which|what|whether|if|when|how)\b/i,
    /\b(?:pick|choose|select)\s+(?:one|an option|from)\b/i
  ];

  const NON_REQUEST_ENDINGS = [
    /\b(?:does that make sense|hope that helps|any questions)\??$/i,
    /\b(?:isn't it|right)\?$/i
  ];

  function classifyInputRequest(text) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return { needsInput: false, reason: "no-text" };

    const tail = normalized.slice(-700);
    if (NON_REQUEST_ENDINGS.some((pattern) => pattern.test(tail))) {
      return { needsInput: false, reason: "conversational-question" };
    }

    const matchedPattern = REQUEST_PATTERNS.find((pattern) => pattern.test(tail));
    if (matchedPattern) return { needsInput: true, reason: "explicit-request" };

    const lastSentence = tail.split(/(?<=[.!])\s+/).pop() || tail;
    if (/\?$/.test(lastSentence) && /\b(?:you|your|we)\b/i.test(lastSentence)) {
      return { needsInput: true, reason: "closing-question" };
    }

    const optionLines = String(text || "").match(/(?:^|\n)\s*(?:[-*]|\d+[.)])\s+[^\n]+/g) || [];
    if (optionLines.length >= 2 && /\b(?:choose|select|prefer|option)\b/i.test(tail)) {
      return { needsInput: true, reason: "options-presented" };
    }

    return { needsInput: false, reason: "completion" };
  }

  root.AINeedsAttention = root.AINeedsAttention || {};
  root.AINeedsAttention.classifyInputRequest = classifyInputRequest;
})(globalThis);
