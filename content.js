(function () {
  "use strict";

  const SETTLE_MS = 1200;
  const TEXT_SETTLE_MS = 1800;
  const SAMPLE_INTERVAL_MS = 1500;
  const WARMUP_MS = 2500;
  const MIN_GENERATION_MS = 400;

  let provider = AINeedsAttention.resolveProvider(location.hostname, location.pathname);
  if (!provider) return;

  let phase = "starting";
  let route = location.href;
  let startedAt = 0;
  let initializedAt = Date.now();
  let settleTimer = null;
  let sampleTimer = null;
  let lastAssistantElement = null;
  let lastAssistantText = "";
  let textChangeCount = 0;
  let firstTextChangeAt = 0;
  let matchedAssistantSelector = null;
  let matchedGeneratingSelector = null;
  let lastSignal = "Initializing detector";
  let observerActive = false;

  function isVisible(element) {
    if (!(element instanceof HTMLElement) || element.hidden) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }

  function findGeneratingIndicator() {
    for (const selector of provider.generatingSelectors) {
      try {
        const element = Array.from(document.querySelectorAll(selector)).find(isVisible);
        if (element) return { element, signal: selector };
      } catch (_error) {
        // A stale provider selector should not stop the remaining adapters.
      }
    }

    const labels = provider.generatingLabels || [];
    if (labels.length) {
      for (const element of document.querySelectorAll("button, [role='button']")) {
        if (!isVisible(element)) continue;
        const label = `${element.getAttribute("aria-label") || ""} ${element.textContent || ""}`.toLowerCase();
        const match = labels.find((candidate) => label.includes(candidate));
        if (match) return { element, signal: `visible control text: ${match}` };
      }
    }

    return null;
  }

  function getAssistantSnapshot() {
    for (const selector of provider.assistantSelectors) {
      let matches = [];
      try {
        matches = Array.from(document.querySelectorAll(selector)).filter(isVisible);
      } catch (_error) {
        continue;
      }
      if (!matches.length) continue;

      const element = matches[matches.length - 1];
      const text = (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
      matchedAssistantSelector = selector;
      return { element, text, count: matches.length, selector };
    }

    matchedAssistantSelector = null;
    return { element: null, text: "", count: 0, selector: null };
  }

  function diagnosticSnapshot(extra) {
    const assistant = getAssistantSnapshot();
    return {
      providerId: provider.id,
      providerName: provider.name,
      phase,
      url: location.href,
      matchedAssistantSelector,
      matchedGeneratingSelector,
      responseCount: assistant.count,
      lastSignal,
      observerActive,
      updatedAt: Date.now(),
      ...(extra || {})
    };
  }

  function send(message, callback) {
    try {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage(message, callback || (() => void chrome.runtime.lastError));
    } catch (_error) {
      // Reloading an unpacked extension invalidates existing content scripts.
    }
  }

  function reportStatus(extra) {
    send({ type: "CONTENT_STATUS", status: diagnosticSnapshot(extra) });
  }

  function setPhase(nextPhase, signal) {
    if (phase === nextPhase && !signal) return;
    phase = nextPhase;
    if (signal) lastSignal = signal;
    reportStatus();
  }

  function cancelSettle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = null;
  }

  function finishGeneration(detectedBy) {
    cancelSettle();
    if (phase !== "generating") return;

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_GENERATION_MS) {
      setPhase("idle", "Ignored a transient generation signal");
      return;
    }

    const assistant = getAssistantSnapshot();
    const classification = AINeedsAttention.classifyInputRequest(assistant.text);
    lastSignal = {
      text: "Response text stopped changing",
      network: "Chat stream completed",
      control: "Generating control disappeared"
    }[detectedBy] || "Generation settled";
    phase = classification.needsInput ? "input" : "ready";

    send({
      type: "RESPONSE_COMPLETE",
      providerId: provider.id,
      providerName: provider.name,
      url: location.href,
      needsInput: classification.needsInput,
      status: diagnosticSnapshot()
    });
  }

  function scheduleFinish(detectedBy, delay) {
    cancelSettle();
    settleTimer = setTimeout(() => {
      settleTimer = null;
      const indicator = findGeneratingIndicator();
      if (indicator) {
        matchedGeneratingSelector = indicator.signal;
        return;
      }
      finishGeneration(detectedBy);
    }, delay);
  }

  function noteAssistantChanges(snapshot, explicitGenerating) {
    if (!snapshot.element) return;

    if (snapshot.element !== lastAssistantElement) {
      lastAssistantElement = snapshot.element;
      lastAssistantText = snapshot.text;
      textChangeCount = 0;
      firstTextChangeAt = 0;
      return;
    }

    if (!snapshot.text || snapshot.text === lastAssistantText) return;

    const grew = snapshot.text.length >= lastAssistantText.length;
    lastAssistantText = snapshot.text;
    if (!grew || Date.now() - initializedAt < WARMUP_MS) return;

    textChangeCount += 1;
    if (!firstTextChangeAt) firstTextChangeAt = Date.now();

    if (!explicitGenerating && textChangeCount >= 2) {
      if (phase !== "generating") {
        startedAt = firstTextChangeAt;
        setPhase("generating", "Assistant text is streaming");
      }
      scheduleFinish("text", TEXT_SETTLE_MS);
    }
  }

  function resetForRoute() {
    cancelSettle();
    route = location.href;
    provider = AINeedsAttention.resolveProvider(location.hostname, location.pathname) || provider;
    phase = "idle";
    startedAt = 0;
    initializedAt = Date.now();
    lastAssistantElement = null;
    lastAssistantText = "";
    textChangeCount = 0;
    firstTextChangeAt = 0;
    matchedGeneratingSelector = null;
    lastSignal = "Conversation route changed";
    reportStatus();
  }

  function sample() {
    sampleTimer = null;
    if (location.href !== route) resetForRoute();

    const indicator = findGeneratingIndicator();
    const explicitGenerating = Boolean(indicator);
    const assistant = getAssistantSnapshot();
    noteAssistantChanges(assistant, explicitGenerating);

    if (explicitGenerating) {
      matchedGeneratingSelector = indicator.signal;
      cancelSettle();
      if (phase !== "generating") {
        startedAt = Date.now();
        textChangeCount = 0;
        firstTextChangeAt = 0;
        setPhase("generating", `Matched ${indicator.signal}`);
      }
    } else if (phase === "generating" && !settleTimer) {
      scheduleFinish("control", SETTLE_MS);
    } else if (phase === "starting") {
      setPhase("idle", assistant.element ? "Assistant messages found" : "Waiting for a conversation");
    }
  }

  function scheduleSample() {
    if (sampleTimer) return;
    sampleTimer = setTimeout(sample, 120);
  }

  function start() {
    if (!document.body) {
      setTimeout(start, 100);
      return;
    }

    const observer = new MutationObserver(scheduleSample);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "disabled", "aria-label", "aria-busy", "data-testid", "data-is-streaming"]
    });
    observerActive = true;

    document.addEventListener("visibilitychange", () => {
      send({ type: "PAGE_VISIBILITY", visible: document.visibilityState === "visible" });
      scheduleSample();
    });
    window.addEventListener("focus", () => send({ type: "PAGE_VISIBILITY", visible: true }));
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== "__AI_NEEDS_ATTENTION__") return;
      if (event.data?.event !== "STREAM_COMPLETE") return;
      if (phase === "generating") scheduleFinish("network", 400);
    });

    chrome.runtime.onMessage.addListener((message, _sender, respond) => {
      if (message?.type === "GET_CONTENT_STATUS") {
        sample();
        respond(diagnosticSnapshot());
        return;
      }
      if (message?.type === "FOCUS_LATEST_RESPONSE") {
        const assistant = getAssistantSnapshot();
        assistant.element?.scrollIntoView({ block: "center", behavior: "smooth" });
        respond({ ok: true });
      }
    });

    sample();
    setInterval(sample, SAMPLE_INTERVAL_MS);
  }

  start();
})();
