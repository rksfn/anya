(function (root) {
  "use strict";

  function suppressionReason({ force, enabled, providerEnabled, tabBeingViewed }) {
    if (force) return null;
    if (enabled === false || providerEnabled === false) return "disabled";
    if (tabBeingViewed) return "viewing";
    return null;
  }

  function notificationOptions({ force, providerName, needsInput }) {
    return {
      type: "basic",
      iconUrl: "icons/notification.png",
      title: "AI needs your attention",
      message: force
        ? "Test successful. Click to return to this tab."
        : `${providerName} ${needsInput ? "is waiting for your input" : "has finished"}. Click to return.`,
      requireInteraction: true,
      priority: 2
    };
  }

  root.AINeedsAttention = root.AINeedsAttention || {};
  root.AINeedsAttention.suppressionReason = suppressionReason;
  root.AINeedsAttention.notificationOptions = notificationOptions;
})(globalThis);
