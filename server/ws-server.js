/*
 * Standalone WebSocket game server (framework-free). Same protocol and privacy
 * model as the PartyKit version, but runs on any host that runs Node
 * (Render, Railway, Fly, a VPS, or your own PC behind a tunnel) — no reliance on
 * PartyKit's hosted platform.
 *
 *   npm install          # gets the `ws` dependency
 *   npm start            # listens on PORT (default 1999)
 *
 * The browser connects to  ws(s)://<host>/parties/main/<room>  (same URL shape
 * the client already builds), and the server keeps one authoritative table per
 * room, redacting every other seat's hand before sending.
 */
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

require(path.join(__dirname, '..', 'js', 'gamelogic.js'));   // sets globalThis.GameLogic
const GameLogic = globalThis.GameLogic;
const DATA = {
  heroes: require(path.join(__dirname, '..', 'data', 'heroes.json')),
  monsters: require(path.join(__dirname, '..', 'data', 'monsters.json')),
  cards: require(path.join(__dirname, '..', 'data', 'cards.json')),
};

const PORT = process.env.PORT || 1999;
const rooms = new Map();   // roomId -> { state, seats: Map<ws, seatId> }

function roomOf(id) {
  if (!rooms.has(id)) rooms.set(id, { state: GameLogic.empty(), seats: new Map() });
  return rooms.get(id);
}
function roomIdFromUrl(url) {
  // accept /parties/main/<room>, /<room>, or ?room=<room>
  try {
    const u = new URL(url, 'http://x');
    const q = u.searchParams.get('room');
    if (q) return q;
    const parts = u.pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || 'table-1');
  } catch (e) { return 'table-1'; }
}
function sendTo(ws, room, seatId) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'snapshot', state: GameLogic.redactFor(room.state, seatId) }));
}
function broadcast(room) {
  for (const [ws, seatId] of room.seats) sendTo(ws, room, seatId);
}

const server = http.createServer((req, res) => {   // simple health check
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('board-game ws server ok\n');
});
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const room = roomOf(roomIdFromUrl(req.url));
  room.seats.set(ws, null);
  sendTo(ws, room, null);

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw.toString()); } catch (_) { return; }
    if (m.t === 'hello' || m.t === 'seat') {
      room.seats.set(ws, m.seatId || null);
      sendTo(ws, room, m.seatId || null);
    } else if (m.t === 'action') {
      room.state = GameLogic.apply(room.state, m.action, DATA);
      broadcast(room);
    }
  });
  ws.on('close', () => {
    room.seats.delete(ws);
    if (room.seats.size === 0) setTimeout(() => { if (room.seats.size === 0) rooms.delete(roomIdFromUrl(req.url)); }, 60 * 60 * 1000);
  });
});

server.listen(PORT, () => console.log(`board-game ws server on :${PORT}`));
