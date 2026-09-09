const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../shared/policy.js");

const { suppressionReason, notificationOptions } = globalThis.AINeedsAttention;

test("notifies even when the browser window still looks focused", () => {
  assert.equal(suppressionReason({
    force: false,
    enabled: true,
    providerEnabled: true,
    pageHasFocus: true
  }), null);
});

test("suppresses when the originating tab is being viewed", () => {
  assert.equal(suppressionReason({
    force: false,
    enabled: true,
    providerEnabled: true,
    tabBeingViewed: true
  }), "viewing");
});

test("notifies when the originating tab is not being viewed", () => {
  assert.equal(suppressionReason({
    force: false,
    enabled: true,
    providerEnabled: true,
    tabBeingViewed: false
  }), null);
});

test("suppresses only when notifications are disabled", () => {
  assert.equal(suppressionReason({
    force: false,
    enabled: false,
    providerEnabled: true
  }), "disabled");
  assert.equal(suppressionReason({
    force: false,
    enabled: true,
    providerEnabled: false
  }), "disabled");
});

test("test notifications bypass disablement and viewing", () => {
  assert.equal(suppressionReason({
    force: true,
    enabled: false,
    providerEnabled: false,
    tabBeingViewed: true
  }), null);
});

test("notification copy uses the product promise and names the provider", () => {
  const options = notificationOptions({ force: false, providerName: "Claude", needsInput: false });
  const inputOptions = notificationOptions({ force: false, providerName: "Claude", needsInput: true });
  const testOptions = notificationOptions({ force: true, providerName: "Test", needsInput: false });
  assert.equal(options.title, "AI needs your attention");
  assert.equal(options.message, "Claude has finished. Click to return.");
  assert.equal(inputOptions.message, "Claude is waiting for your input. Click to return.");
  assert.equal(testOptions.message, "Test successful. Click to return to this tab.");
  assert.equal(options.iconUrl, "icons/notification.png");
  assert.equal(options.requireInteraction, true);
  assert.equal(options.silent, true);
  assert.equal("contextMessage" in options, false);
  const root = path.resolve(__dirname, "..");
  const notify = fs.readFileSync(path.join(root, "icons/notification.png"));
  const logo = fs.readFileSync(path.join(root, "icons/icon-128.png"));
  assert.notEqual(notify.equals(logo), true);
});
