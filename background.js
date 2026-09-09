"use strict";

importScripts("shared/providers.js", "shared/policy.js");

const DEFAULT_SETTINGS = {
  enabled: true,
  providerEnabled: Object.fromEntries(AINeedsAttention.providers.map((provider) => [provider.id, true]))
};
const NOTIFICATION_PREFIX = "anya:";
const OFFSCREEN_PATH = "offscreen.html";

let tabStates = {};
let notificationTargets = {};
let hydrated = false;
let creatingOffscreen = null;
let soundChannel = null;

async function hydrate() {
  if (hydrated) return;
  const session = await chrome.storage.session.get(["tabStates", "notificationTargets"]);
  tabStates = session.tabStates || {};
  notificationTargets = session.notificationTargets || {};
  hydrated = true;
}

async function persistSession() {
  await chrome.storage.session.set({ tabStates, notificationTargets });
}

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    enabled: stored.enabled !== false,
    providerEnabled: { ...DEFAULT_SETTINGS.providerEnabled, ...(stored.providerEnabled || {}) }
  };
}

async function isTabBeingViewed(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const window = await chrome.windows.get(tab.windowId);
    return Boolean(tab.active && window.focused);
  } catch (_error) {
    return false;
  }
}

async function setBadge(tabId, phase) {
  if (typeof tabId !== "number" || tabId < 0) return;
  const ready = phase === "ready" || phase === "input";
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: phase === "input" ? "#9B3A58" : "#176B75" });
    await chrome.action.setBadgeText({ tabId, text: ready ? "1" : "" });
  } catch (_error) {
    // The tab may have closed between the detector event and the badge write.
  }
}

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_PATH);
  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });
  if (existing.length) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play a short chime when an AI needs attention."
  });
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

async function playNotificationSound() {
  try {
    await setupOffscreenDocument();
    if (!soundChannel) soundChannel = new BroadcastChannel("anya-sound");
    soundChannel.postMessage({ type: "play" });
  } catch (error) {
    console.warn("[ANYA] notification sound failed", error);
  }
}

async function createNotification(message, tabId, force) {
  const settings = await getSettings();
  const tabBeingViewed = !force && typeof tabId === "number" && tabId >= 0
    ? await isTabBeingViewed(tabId)
    : false;
  const reason = AINeedsAttention.suppressionReason({
    force,
    enabled: settings.enabled,
    providerEnabled: settings.providerEnabled[message.providerId],
    tabBeingViewed
  });
  if (reason === "disabled" || reason === "viewing") {
    return { notified: false, reason };
  }

  const notificationId = `${NOTIFICATION_PREFIX}${tabId}:${Date.now()}`;
  const needsInput = Boolean(message.needsInput);
  notificationTargets[notificationId] = {
    tabId,
    url: message.url,
    providerId: message.providerId,
    createdAt: Date.now()
  };

  try {
    await chrome.notifications.create(notificationId, AINeedsAttention.notificationOptions({
      force,
      providerName: message.providerName,
      needsInput
    }));
  } catch (error) {
    delete notificationTargets[notificationId];
    return { notified: false, reason: error.message };
  }

  await playNotificationSound();
  await persistSession();
  return { notified: true, notificationId };
}

async function handleResponseComplete(message, sender) {
  await hydrate();
  const tabId = sender.tab?.id;
  if (typeof tabId !== "number") return { ok: false, reason: "missing-tab" };

  const result = await createNotification(message, tabId, false);
  tabStates[tabId] = { ...message.status, tabId, phase: message.needsInput ? "input" : "ready" };
  await setBadge(tabId, result.reason === "viewing" ? "idle" : tabStates[tabId].phase);
  await persistSession();
  return { ok: true, ...result };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function focusWindow(windowId) {
  const update = { focused: true };
  try {
    const win = await chrome.windows.get(windowId);
    if (win.state === "minimized") update.state = "normal";
  } catch (_error) {
    // The window id is still worth focusing even if we cannot read its state.
  }
  await chrome.windows.update(windowId, update);
}

async function focusChat(target) {
  let tab = null;
  try {
    tab = await chrome.tabs.get(target.tabId);
  } catch (_error) {
    tab = null;
  }

  if (!tab) {
    if (!target.url || !AINeedsAttention.resolveProvider(new URL(target.url).hostname, new URL(target.url).pathname)) return;
    const created = await chrome.tabs.create({ url: target.url, active: true });
    if (created.windowId) await focusWindow(created.windowId);
    return;
  }

  await focusWindow(tab.windowId);
  await chrome.tabs.update(tab.id, { active: true });
  await focusWindow(tab.windowId);
  await sleep(80);
  await focusWindow(tab.windowId);
  await chrome.tabs.sendMessage(tab.id, { type: "FOCUS_LATEST_RESPONSE" }).catch(() => undefined);
}

async function focusNotification(notificationId) {
  await hydrate();
  const target = notificationTargets[notificationId];
  if (!target) return;

  await focusChat(target);
  await setBadge(target.tabId, "idle").catch(() => undefined);
  delete notificationTargets[notificationId];
  await chrome.notifications.clear(notificationId);
  await persistSession();
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(["enabled", "providerEnabled"]);
  await chrome.storage.local.set({
    enabled: current.enabled ?? DEFAULT_SETTINGS.enabled,
    providerEnabled: { ...DEFAULT_SETTINGS.providerEnabled, ...(current.providerEnabled || {}) }
  });
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  (async () => {
    await hydrate();

    switch (message?.type) {
      case "CONTENT_STATUS": {
        const tabId = sender.tab?.id;
        if (typeof tabId === "number") {
          tabStates[tabId] = { ...message.status, tabId };
          await setBadge(tabId, message.status.phase);
          await persistSession();
        }
        respond({ ok: true });
        break;
      }
      case "RESPONSE_COMPLETE":
        respond(await handleResponseComplete(message, sender));
        break;
      case "PAGE_VISIBILITY": {
        const tabId = sender.tab?.id;
        if (message.visible && typeof tabId === "number" && await isTabBeingViewed(tabId)) {
          await setBadge(tabId, "idle");
        }
        respond({ ok: true });
        break;
      }
      case "GET_SNAPSHOT":
        respond({
          settings: await getSettings(),
          providers: AINeedsAttention.providers.map(({ id, name }) => ({ id, name }))
        });
        break;
      case "UPDATE_SETTINGS": {
        const settings = await getSettings();
        const next = {
          enabled: typeof message.patch?.enabled === "boolean" ? message.patch.enabled : settings.enabled,
          providerEnabled: { ...settings.providerEnabled, ...(message.patch?.providerEnabled || {}) }
        };
        await chrome.storage.local.set(next);
        respond({ ok: true, settings: next });
        break;
      }
      case "TEST_NOTIFICATION": {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        respond(await createNotification({
          providerId: "test",
          providerName: "ANYA",
          needsInput: false,
          url: tab?.url
        }, tab?.id ?? -1, true));
        break;
      }
      default:
        respond({ ok: false, reason: "unknown-message" });
    }
  })().catch((error) => {
    console.error("[ANYA]", error);
    respond({ ok: false, reason: error.message });
  });
  return true;
});

chrome.notifications.onClicked.addListener(focusNotification);
chrome.notifications.onClosed.addListener(async (notificationId) => {
  await hydrate();
  if (notificationTargets[notificationId]) {
    delete notificationTargets[notificationId];
    await persistSession();
  }
});
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await hydrate();
  delete tabStates[tabId];
  await persistSession();
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (await isTabBeingViewed(tabId)) await setBadge(tabId, "idle");
});
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab?.id && await isTabBeingViewed(tab.id)) await setBadge(tab.id, "idle");
});
