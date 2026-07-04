/*
 * GameState — the shared, synchronized play state (decks, seats/hands, turn,
 * dice/grid rolls). Persists to localStorage and syncs across tabs via
 * BroadcastChannel.
 *
 * SYNC ARCHITECTURE (transport seam)
 * ----------------------------------
 * All mutations go through _commit(), which bumps `rev`, persists, notifies
 * local listeners, and hands the snapshot to a pluggable transport. The default
 * `LocalTransport` (BroadcastChannel + localStorage) gives same-machine,
 * multi-tab sync — enough to prove hidden hands and a live board.
 *
 * For true CROSS-DEVICE realtime with private hands, swap in a NetworkTransport
 * (WebSocket to a small authoritative server, or Supabase/PartyKit/Firebase):
 *   - implement { join(room, onRemote), send(snapshot) } with the same shape,
 *   - the server holds the master state and, crucially, redacts other players'
 *     `hand` arrays before sending to each client (see redactFor()).
 * `mySeatId` is intentionally LOCAL (never synced) — it's "who am I at this
 * screen", which is what makes a hand private to one device.
 */

const GS_STORE_KEY = 'board_game_state';
const GS_SEAT_KEY = 'board_game_my_seat';
const GS_CHANNEL = 'board_game_sync';

class LocalTransport {
    constructor() { this.bc = ('BroadcastChannel' in window) ? new BroadcastChannel(GS_CHANNEL) : null; }
    join(onRemote) { if (this.bc) this.bc.onmessage = (e) => onRemote(e.data); }
    send(snapshot) { if (this.bc) this.bc.postMessage(snapshot); }
}

class GameState {
    constructor(transport) {
        this.listeners = new Set();
        this.transport = transport || new LocalTransport();
        this.mySeatId = localStorage.getItem(GS_SEAT_KEY) || null;   // local-only
        this.state = this._load() || this._empty();
        this.transport.join((snap) => this._onRemote(snap));
    }

    // ---- lifecycle --------------------------------------------------------
    _empty() { return { rev: 0, room: 'table-1', started: false, decks: null, seats: [], activeSeatId: null, lastDice: null, lastGrid: null }; }
    _load() {
        try { const r = localStorage.getItem(GS_STORE_KEY); return r ? JSON.parse(r) : null; }
        catch (e) { return null; }
    }
    _commit(persistOnly = false) {
        this.state.rev = (this.state.rev || 0) + 1;
        try { localStorage.setItem(GS_STORE_KEY, JSON.stringify(this.state)); } catch (e) {}
        if (!persistOnly) this.transport.send(this.state);
        this._emit();
    }
    _onRemote(snap) {
        if (snap && typeof snap.rev === 'number' && snap.rev > (this.state.rev || 0)) {
            this.state = snap;
            try { localStorage.setItem(GS_STORE_KEY, JSON.stringify(snap)); } catch (e) {}
            this._emit();
        }
    }
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _emit() { this.listeners.forEach(fn => { try { fn(this.state); } catch (e) { console.error(e); } }); }

    setMySeat(seatId) {
        this.mySeatId = seatId;
        if (seatId) localStorage.setItem(GS_SEAT_KEY, seatId); else localStorage.removeItem(GS_SEAT_KEY);
        this._emit();
    }

    // Server-side redaction helper (documented for the network transport):
    // returns a copy where every hand except `seatId` is replaced by its count.
    static redactFor(state, seatId) {
        const s = JSON.parse(JSON.stringify(state));
        s.seats.forEach(seat => { if (seat.id !== seatId) seat.hand = seat.hand.map(() => null); });
        return s;
    }

    // ---- setup ------------------------------------------------------------
    newGame() {
        const data = window.GAME_DATA || { heroes: [], monsters: [], cards: [] };
        // build decks as shuffled instances { iid, cid }
        const build = (deckName) => {
            const pile = [];
            data.cards.filter(c => c.deck === deckName).forEach(c => {
                for (let i = 0; i < (c.copies || 1); i++) pile.push({ iid: `${c.id}-${i}-${Math.random().toString(36).slice(2, 7)}`, cid: c.id });
            });
            return this._shuffle(pile);
        };
        this.state.decks = { White: { draw: build('White'), discard: [] }, Black: { draw: build('Black'), discard: [] } };

        // one seat per hero color (front character) + one monster seat
        const seats = [];
        const byColor = {};
        data.heroes.forEach(h => { if (!byColor[h.color] || h.cardFace === 'front') byColor[h.color] = h; });
        ['RED', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'].forEach(col => {
            const h = byColor[col]; if (!h) return;
            seats.push({ id: 'seat-' + col.toLowerCase(), label: h.name, kind: 'hero', deck: 'White', color: col, characterId: h.id, hand: [] });
        });
        const mon = data.monsters[0];
        seats.push({ id: 'seat-monster', label: mon ? mon.name : 'Monster', kind: 'monster', deck: 'Black', color: 'MONSTER', characterId: mon ? mon.id : null, hand: [] });

        this.state.seats = seats;
        this.state.activeSeatId = seats[0].id;
        this.state.started = true;
        this.state.lastDice = null; this.state.lastGrid = null;
        this._commit();
    }
    resetGame() { this.state = this._empty(); this._commit(); }

    _shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

    // ---- helpers ----------------------------------------------------------
    seat(id) { return this.state.seats.find(s => s.id === id); }
    character(seat) {
        const d = window.GAME_DATA; if (!seat || !d) return null;
        return (seat.kind === 'monster' ? d.monsters : d.heroes).find(c => c.id === seat.characterId) || null;
    }
    card(cid) { return (window.GAME_DATA.cards || []).find(c => c.id === cid); }

    // ---- actions ----------------------------------------------------------
    draw(seatId, deckName) {
        const seat = this.seat(seatId); const deck = this.state.decks[deckName || (seat && seat.deck)];
        if (!seat || !deck) return;
        if (!deck.draw.length) { deck.draw = this._shuffle(deck.discard); deck.discard = []; }
        if (!deck.draw.length) return;
        seat.hand.push(deck.draw.pop());
        this._commit();
    }
    discard(seatId, iid) {
        const seat = this.seat(seatId); if (!seat) return;
        const idx = seat.hand.findIndex(c => c.iid === iid); if (idx < 0) return;
        const [inst] = seat.hand.splice(idx, 1);
        const card = this.card(inst.cid);
        const deck = this.state.decks[card ? card.deck : seat.deck] || this.state.decks[seat.deck];
        if (deck) deck.discard.push(inst);
        this._commit();
    }
    setActive(seatId) { this.state.activeSeatId = seatId; this._commit(); }
    nextTurn() {
        const seats = this.state.seats; if (!seats.length) return;
        const i = seats.findIndex(s => s.id === this.state.activeSeatId);
        this.state.activeSeatId = seats[(i + 1) % seats.length].id;
        this._commit();
    }
    setSeatCharacter(seatId, characterId) { const s = this.seat(seatId); if (s) { s.characterId = characterId; const c = this.character(s); if (c) s.label = c.name; this._commit(); } }

    rollDice(seatId, dieList) {
        // dieList: [{key, die}] — roll each, record result
        const rolls = dieList.filter(d => d.die).map(d => ({ key: d.key, die: d.die, value: 1 + Math.floor(Math.random() * d.die) }));
        const total = rolls.reduce((n, r) => n + r.value, 0);
        this.state.lastDice = { seatId, rolls, total, ts: Date.now() };
        this._commit();
    }
    rollGrid(cols, rows) {
        const col = 1 + Math.floor(Math.random() * Math.max(1, cols));
        const rowIdx = Math.floor(Math.random() * Math.max(1, rows));
        this.state.lastGrid = { col, row: String.fromCharCode(65 + rowIdx), ts: Date.now() };
        this._commit();
    }
}
