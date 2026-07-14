# 🌑 DARKNOTE vs3 — WhatsApp Multi-Engine Bot

Three independent, switchable WhatsApp bot engines linked via a phone-number
pairing code. No QR scan needed.

## Setup on your host

```
npm install
npm start
```

Then open `http://<your-host>:<port>/whatsapp/pair` in a browser.

## Link your WhatsApp number

1. Open `/whatsapp/pair` — enter your phone number with country code, digits
   only (e.g. **255712345678** for Tanzania, **15551234567** for US).
2. Click **Get pairing code** — an 8-character code appears.
3. On your phone: WhatsApp → Settings → Linked Devices → Link a Device →
   **Link with phone number instead** → type the code.
4. Done. Session credentials are saved under `whatsapp/.data/whatsapp-auth/`
   and survive restarts. **Never share this folder** — it gives full access
   to the linked account.

## The three engines

| File | Activate with | Prefix |
|---|---|---|
| `whatsapp/engines/BigBro.js` | `switch1` | `.` |
| `whatsapp/engines/BigBro2.js` | `switch2` | `!` |
| `whatsapp/engines/BigBro3.js` | `switch3` | `#` |

Send `switch1`, `switch2`, or `switch3` from any chat to change the active
engine. The choice is remembered across restarts.

## Adding a profile image or audio

Use the upload section on `/whatsapp/pair` — pick a JPG/PNG for the menu
image and an optional MP3 for the audio clip, then click **Upload to Engine N**.
You can also drop files directly into `whatsapp/assets/engine1/`,
`engine2/`, or `engine3/` (name them `profile.jpg` and `audio.mp3`).

## Notes

- Requires Node.js 18 or newer.
- Uses `@whiskeysockets/baileys` (unofficial WhatsApp client). Avoid
  spam/mass messaging to prevent account bans.
