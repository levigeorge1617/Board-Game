# Cross-device multiplayer (PartyKit)

The game plays fine on one screen with no setup (hotseat: hidden hands across
browser tabs via `BroadcastChannel`). For separate phones/laptops with truly
private hands, run the small **PartyKit** server in `party/server.js`.

## How it works

- `js/gamelogic.js` is the single reducer for every state change. The browser and
  the server both use it, so online and offline behave identically and all
  randomness (shuffles, dice) happens once.
- The **server is the authority**: clients send *actions* (draw, roll, …), the
  server applies them and pushes each connection a snapshot.
- Before sending, the server calls `GameLogic.redactFor(state, seatId)`, which
  replaces every *other* seat's `hand` with nulls. Your cards never leave the
  server toward anyone else — that's what makes hands private.
- Each device tells the server which seat it is (`{t:'seat'}`); `mySeatId` is
  stored only in that browser, never shared.

## One-time setup

```bash
npm install          # installs partykit (dev dependency)
```

## Play locally (all devices on the same wifi)

1. Start the game server:
   ```bash
   npm run party      # PartyKit dev server on http://0.0.0.0:1999
   ```
2. Serve the app (separate terminal):
   ```bash
   npm run serve      # http://localhost:8099
   ```
3. On each device (same wifi), open `http://<your-computer-ip>:8099`, click
   **🌐 Go online**, and enter:
   - **Host:** `<your-computer-ip>:1999`  (e.g. `192.168.1.20:1999`)
   - **Room:** any shared code, e.g. `table-1`
4. One player clicks **Deal & start**; everyone picks their seat from the
   **You:** dropdown. Draw from your pile — only you see your hand.

> Find your computer's LAN IP with `ipconfig` (Windows) or `ipconfig getifaddr en0`
> (Mac). `localhost` only works on the same machine.

## Play over the internet (deploy the server)

```bash
npx partykit login     # free; opens the browser (GitHub)
npm run deploy         # deploys party/server.js
```

Deploy prints a URL like `board-game.<your-username>.partykit.dev`. On each
device click **🌐 Go online** and enter that as the **Host** (no `https://`,
no port) with a shared **Room** code. Host the static app anywhere
(GitHub Pages, Netlify, Vercel, Cloudflare Pages) and share the link.

## Notes / next steps

- The server keeps the table in room storage, so a refresh rejoins the game.
- Current server trusts clients' actions (fine for friends). If you later want
  anti-cheat, add turn/seat validation inside `apply()` on the server.
- `partykit.json` sets the project name/entry; rename `name` before deploying
  if you want a different subdomain.
