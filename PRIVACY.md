# Privacy policy

**ANYA** (“AI Needs Your Attention”) is a browser extension. This policy describes how ANYA handles information on your device.

Effective date: 9 September 2026

## Summary

ANYA runs locally in your browser. It has no backend, no account, no analytics, and it does not make extension-originated network requests. Conversation text is not sent to a server.

## Information ANYA handles

ANYA handles only what it needs to notify you about a supported AI tab and to remember your settings.

- **Notification settings.** On/off for all notifications, and on/off per supported product (ChatGPT, Claude, Gemini, Grok, Perplexity). Stored in `chrome.storage.local` on your device until you change them or uninstall ANYA.
- **Tab URL and tab id.** When a supported AI tab may need you, ANYA keeps the tab id and URL in `chrome.storage.session` so a notification click can return you to that tab. A URL may include a conversation id assigned by the AI product. This session state is not written to disk by ANYA and is cleared when the tab closes or the browser session ends.
- **Page content on supported AI sites.** On ChatGPT, Claude, Gemini, Grok, and Perplexity pages, ANYA reads visible assistant text in the page in order to detect that a reply finished and to apply a small local heuristic that looks only at the end of a response for a direct question or request. That text stays in the page. The extension worker does not store conversation content.
- **Tab focus.** ANYA checks whether you are already looking at the originating tab so it can suppress a notification you do not need.

ANYA does not collect your name, email, payment information, authentication credentials, location, or a browsing history of sites other than the supported AI products you already have open.

## How that information is used

- To show a system notification when a supported AI finishes or appears to need input, if you are not already viewing that tab.
- To focus the matching window and tab when you click a notification.
- To honor your global and per-product notification settings.
- To show a badge on the extension icon for a tab that is ready or waiting.

## What ANYA does not do

- No backend or extension-originated network requests
- No analytics, advertising, or tracking
- No sale or sharing of user data
- No remote code
- No account

On supported pages, a page-world script wraps `fetch` so ANYA can notice when a chat stream ends. It clones the response, reads that copy until it finishes, and discards the bytes. The only message it posts is a `STREAM_COMPLETE` ping, with no response text.

## Sharing

ANYA does not send the information above to the developer or to any third party. System notifications are displayed by your browser and operating system.

ANYA may disclose information if required by law.

## Retention

- Settings remain on your device until you change them or uninstall the extension.
- Session tab state lasts only for the browser session and is removed when the tab closes.
- Uninstalling ANYA removes its local and session storage.

## Limited use

ANYA uses the information described here only to provide its single purpose: notifying you when a supported web AI chat has finished or appears to need input, and returning you to that tab if you click the notification. It is not used for advertising, credit decisions, or any unrelated purpose.

## Changes

If this policy changes, the effective date above will be updated and the revised policy will be posted at this URL.

## Contact

Questions about this policy: [github.com/rksfn/anya/issues](https://github.com/rksfn/anya/issues)
