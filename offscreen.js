"use strict";

let activeContext = null;

function tone(context, frequency, start, duration, peak) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

async function playChime() {
  if (activeContext) {
    await activeContext.close().catch(() => undefined);
    activeContext = null;
  }

  const context = new AudioContext();
  activeContext = context;
  await context.resume();

  const start = context.currentTime;
  tone(context, 784, start, 0.22, 0.22);
  tone(context, 1174.66, start + 0.14, 0.32, 0.18);

  await new Promise((resolve) => setTimeout(resolve, 520));
  if (activeContext === context) {
    await context.close().catch(() => undefined);
    activeContext = null;
  }
}

const soundChannel = new BroadcastChannel("anya-sound");
soundChannel.onmessage = (event) => {
  if (event.data?.type !== "play") return;
  playChime().catch((error) => console.warn("[ANYA]", error));
};
