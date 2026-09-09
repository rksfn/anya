(function () {
  "use strict";

  const CHANNEL = "__AI_NEEDS_ATTENTION__";

  function notify() {
    window.postMessage({ type: CHANNEL, event: "STREAM_COMPLETE" }, "*");
  }

  function drain(stream) {
    if (!stream) {
      notify();
      return;
    }
    const reader = stream.getReader();
    const pull = () =>
      reader.read().then(({ done }) => {
        if (done) notify();
        else return pull();
      }).catch(() => notify());
    pull();
  }

  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    return originalFetch.apply(this, args).then((response) => {
      try {
        if (AINeedsAttention.looksLikeChatStream(response.url, response.headers.get("content-type"))) {
          drain(response.clone().body);
        }
      } catch (_error) {
        // Page fetch must still succeed if our probe fails.
      }
      return response;
    });
  };
})();
