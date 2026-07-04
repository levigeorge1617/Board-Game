/*
 * PartyKit room server — the authority for one game table.
 *
 * It holds the full game state, applies actions with the SAME reducer the client
 * uses (js/gamelogic.js), and — crucially — sends each connection a snapshot with
 * the other seats' hands stripped out (GameLogic.redactFor). A player's cards
 * therefore never travel to anyone else's device.
 *
 * Run locally:   npx partykit dev
 * Deploy:        npx partykit deploy
 */
import "../js/gamelogic.js";                 // side effect: sets globalThis.GameLogic
import heroes from "../data/heroes.json";
import monsters from "../data/monsters.json";
import cards from "../data/cards.json";

const DATA = { heroes, monsters, cards };
const GameLogic = globalThis.GameLogic;

export default class GameServer {
  constructor(room) {
    this.room = room;
    this.state = GameLogic.empty();
    this.seats = new Map();      // connectionId -> seatId (who each device is)
  }

  async onStart() {
    const saved = await this.room.storage.get("state");
    if (saved) this.state = saved;
  }

  onConnect(conn) {
    this._sendTo(conn, this.seats.get(conn.id) || null);
  }

  onClose(conn) { this.seats.delete(conn.id); }

  async onMessage(raw, conn) {
    let m;
    try { m = JSON.parse(raw); } catch (_) { return; }

    if (m.t === "hello" || m.t === "seat") {
      this.seats.set(conn.id, m.seatId || null);
      this._sendTo(conn, m.seatId || null);
      return;
    }
    if (m.t === "action") {
      this.state = GameLogic.apply(this.state, m.action, DATA);
      await this.room.storage.put("state", this.state);
      this._broadcast();
    }
  }

  _sendTo(conn, seatId) {
    conn.send(JSON.stringify({ t: "snapshot", state: GameLogic.redactFor(this.state, seatId) }));
  }
  _broadcast() {
    for (const conn of this.room.getConnections()) {
      this._sendTo(conn, this.seats.get(conn.id) || null);
    }
  }
}
