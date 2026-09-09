# Chrome Web Store listing

Paste these fields into [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole). Upload `dist/anya-0.1.0.zip`.

Privacy policy URL (after GitHub Pages is live):

`https://rksfn.github.io/anya/privacy.html`

Fallback until Pages is enabled:

`https://github.com/rksfn/anya/blob/main/PRIVACY.md`

## Store listing

**Name** (from the manifest, not editable here): ANYA

**Summary** (from the manifest description): AI needs your attention. You decide whether to give it.

**Detailed description**

```
ANYA tells you when a web AI is done, or when it is waiting for you. You decide whether to go back.

Give it a request, leave the tab, do something else. When the response finishes or it asks you something, you get a system notification and a short chime. Click it to return to that tab, or don't.

No scoring. No inbox. No automatic switching.

Supported products
• ChatGPT (chatgpt.com, chat.openai.com)
• Claude (claude.ai)
• Gemini (gemini.google.com)
• Grok (grok.com, x.com/i/grok)
• Perplexity (perplexity.ai)

Turn notifications on or off for everything, or per product.

How it works
ANYA watches only the AI tabs you already have open. It notices when a reply starts, then when it finishes or looks like a question. If you are not looking at that tab, it sends a system notification and plays a short chime. Clicking the notification focuses that window and tab.

Detection stays on your machine. ANYA does not send conversation text anywhere. There is no account, no backend, and no analytics.

If a test notification does not appear, allow notifications for your browser in your operating system settings. System notifications identify the browser as the sender.
```

**Category:** Productivity

**Language:** English (United States)

**Graphic assets**

- Store icon: `store/assets/icon-128.png`
- Screenshots (1280×800): `store/assets/screenshot-1.png` … `screenshot-4.png`
- Small promo tile (440×280): `store/assets/promo-small.png`
- Marquee promo tile (1400×560): `store/assets/promo-marquee.png`

**Homepage URL:** https://github.com/rksfn/anya

**Support URL:** https://github.com/rksfn/anya/issues

**Mature content:** No

## Privacy

**Single purpose**

```
Notify the user when a supported web AI chat has finished or appears to need input, and focus that tab if they click the notification.
```

**Permission justifications**

notifications:

```
Show a system notification when a supported AI chat finishes or appears to need input, and when the user sends a test notification from the popup.
```

storage:

```
Save the user's global and per-product notification settings on the device. Session storage keeps ephemeral tab ids and URLs so a notification click can return to the right tab.
```

tabs:

```
Check whether the originating AI tab is already being viewed (to suppress unneeded notifications), read that tab's URL so a notification click can return to it, and focus the matching window and tab.
```

offscreen:

```
Play a short local chime when a notification is shown. Chrome service workers cannot play audio, so ANYA opens a hidden offscreen document only for that sound.
```

**Host permission justifications**

https://chatgpt.com/* and https://chat.openai.com/*:

```
Run content scripts on ChatGPT so ANYA can detect when a reply is generating, finished, or waiting for input on that tab.
```

https://claude.ai/*:

```
Run content scripts on Claude so ANYA can detect when a reply is generating, finished, or waiting for input on that tab.
```

https://gemini.google.com/*:

```
Run content scripts on Gemini so ANYA can detect when a reply is generating, finished, or waiting for input on that tab.
```

https://grok.com/* and https://x.com/i/grok*:

```
Run content scripts on Grok so ANYA can detect when a reply is generating, finished, or waiting for input on that tab. The x.com match is limited to the Grok path.
```

https://www.perplexity.ai/* and https://perplexity.ai/*:

```
Run content scripts on Perplexity so ANYA can detect when a reply is generating, finished, or waiting for input on that tab.
```

**Remote code:** No, I am not using remote code.

**Data use**

Check these collection types:

- Website content — visible assistant text is read in the page to detect completion and to apply a local input-request heuristic. It is not stored in the extension worker and is not sent off the device.
- Web history — the originating tab URL is kept in session storage so a notification click can return to that conversation. It may include a conversation id from the AI product.

Do not check: personally identifiable information, health, financial, authentication, location, personal communications.

Certify all limited-use statements (no sale, no unrelated use, no creditworthiness, limited use).

**Privacy policy URL:** https://rksfn.github.io/anya/privacy.html

## Distribution

- Visibility: Public
- Regions: All regions
- Pricing: Free

If the dashboard asks whether you are a trader in the EU/EEA/UK, choose the option that matches you. For a personal, free extension you typically declare you are not a trader.

## Test instructions

```
ANYA does not require an account.

Fast path (no AI site login):
1. Install the uploaded package.
2. Open the popup.
3. Confirm providers are listed: ChatGPT, Claude, Gemini, Grok, Perplexity.
4. Click "Test notification".
5. A system notification should appear: title "AI needs your attention", message "Test successful. Click to return to this tab." A short chime should play.
6. Click the notification. Chrome should focus the window and tab that were active when you clicked Test.

Full path (optional, needs a session on a supported AI site):
1. Open ChatGPT, Claude, Gemini, Grok, or Perplexity and start a generation.
2. Switch to another tab or unfocus the window before it finishes.
3. When the reply finishes, a notification should appear naming that product.
4. Click it to return to the AI tab.

Notes:
- Notifications are suppressed while you are looking at the originating tab.
- The page-world fetch wrapper only clones chat streams, reads the copy until it ends, discards the bytes, and posts a STREAM_COMPLETE ping. It does not modify requests or responses, and it does not send conversation text to the extension worker.
- There is no remote code, no backend, and no analytics.
- If the test notification does not appear, the OS is blocking Chrome notifications.
```

## Submit

1. Register at https://chrome.google.com/webstore/devconsole if needed (one-time developer fee).
2. Add new item → upload `dist/anya-0.1.0.zip`.
3. Fill Store listing, Privacy, Distribution, and Test instructions from this file.
4. Submit for review. You can uncheck “publish automatically” if you want to release it yourself after approval.
