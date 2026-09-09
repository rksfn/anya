"use strict";

const elements = {
  enabled: document.querySelector("#enabled"),
  statusWord: document.querySelector("#status-word"),
  statusHint: document.querySelector("#status-hint"),
  providers: document.querySelector("#providers"),
  testButton: document.querySelector("#test-notification"),
  testResult: document.querySelector("#test-result")
};

let snapshot = null;

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function renderProviders() {
  elements.providers.replaceChildren();

  for (const provider of snapshot.providers) {
    const row = document.createElement("label");
    row.className = "provider-row";

    const name = document.createElement("span");
    name.className = "provider-name";
    name.textContent = provider.name;

    const toggle = document.createElement("span");
    toggle.className = "switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = snapshot.settings.providerEnabled[provider.id] !== false;
    input.disabled = !snapshot.settings.enabled;
    input.setAttribute("aria-label", `Enable ${provider.name} notifications`);
    input.addEventListener("change", async () => {
      snapshot.settings.providerEnabled[provider.id] = input.checked;
      await send({ type: "UPDATE_SETTINGS", patch: { providerEnabled: { [provider.id]: input.checked } } });
    });

    const track = document.createElement("span");
    track.setAttribute("aria-hidden", "true");
    toggle.append(input, track);
    row.append(name, toggle);
    elements.providers.append(row);
  }
}

function render() {
  const enabled = snapshot.settings.enabled;
  document.body.classList.toggle("is-paused", !enabled);
  elements.enabled.setAttribute("aria-pressed", String(enabled));
  elements.enabled.setAttribute("aria-label", enabled ? "Pause all notifications" : "Resume all notifications");
  elements.statusWord.textContent = enabled ? "On watch" : "Paused";
  elements.statusHint.textContent = enabled ? "Click to pause" : "Click to resume";
  renderProviders();
}

async function initialize() {
  snapshot = await send({ type: "GET_SNAPSHOT" });
  render();
}

elements.enabled.addEventListener("click", async () => {
  snapshot.settings.enabled = !snapshot.settings.enabled;
  await send({ type: "UPDATE_SETTINGS", patch: { enabled: snapshot.settings.enabled } });
  render();
});

elements.testButton.addEventListener("click", async () => {
  elements.testButton.disabled = true;
  elements.testButton.textContent = "Sending…";
  elements.testResult.classList.remove("is-error");
  elements.testResult.textContent = "";

  try {
    const result = await send({ type: "TEST_NOTIFICATION" });
    if (result?.notified) {
      elements.testResult.textContent = "Test sent. You should hear a chime.";
    } else {
      elements.testResult.classList.add("is-error");
      elements.testResult.textContent = "Notification blocked. Allow browser notifications in system settings.";
    }
  } catch (_error) {
    elements.testResult.classList.add("is-error");
    elements.testResult.textContent = "Extension unavailable. Reload it and try again.";
  } finally {
    elements.testButton.disabled = false;
    elements.testButton.textContent = "Test notification";
  }
});

initialize().catch(() => {
  elements.statusWord.textContent = "Unavailable";
  elements.statusHint.textContent = "Reload extension";
  elements.testResult.classList.add("is-error");
  elements.testResult.textContent = "ANYA could not read its settings. Reload the extension and try again.";
});
