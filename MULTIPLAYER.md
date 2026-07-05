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

## Play over the internet

You need the game server reachable at a public `wss://` address. Two easy ways —
both use the framework-free Node server in `server/ws-server.js`.

### Option A — your PC + a free tunnel (instant, no signup)

Good for "let's play tonight". Your PC stays on during the game.

```bash
npm install
npm start                                   # server on http://localhost:1999
npx cloudflared tunnel --url http://localhost:1999
```

Cloudflared prints a public URL like `https://calm-otter-1234.trycloudflare.com`.
Players click **🌐 Go online** and enter that as the **Host** (no `https://`),
with a shared **Room** code.

### Option B — always-on host (Render)

So friends can play without your PC on.

1. Push this repo to GitHub (done).
2. On https://render.com → **New → Web Service** → connect the repo.
3. Settings: **Build** `npm install`, **Start** `npm start` (it reads `PORT`).
4. Deploy → you get `https://your-app.onrender.com`. Players use
   `your-app.onrender.com` as the **Host**.

Any Node host works the same way (Railway, Fly.io, Glitch, a VPS): run
`npm start`, expose the port over HTTPS/WSS.

### Point the app at your server

Set your host once in `js/config.js`:

```js
window.GAME_SERVER = 'your-app.onrender.com';   // no https://, no port
```

Then players never type a host — **🌐 Go online** only asks for a room code, the
**🔗 Invite** button copies a `?room=CODE` link, and opening that link
auto-joins the table. Override per-visit with `?host=...` in the URL.

> PartyKit's own hosted platform (`npm run deploy`) is an alternative, but its
> shared `partykit.dev` domain is currently at capacity, so the Node server above
> is the reliable path.

## Notes / next steps

- The server keeps the table in room storage, so a refresh rejoins the game.
- Current server trusts clients' actions (fine for friends). If you later want
  anti-cheat, add turn/seat validation inside `apply()` on the server.
- `partykit.json` sets the project name/entry; rename `name` before deploying
  if you want a different subdomain.
