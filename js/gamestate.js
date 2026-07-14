/*
 * GameState (client) — holds the play state and routes every change through the
 * shared reducer (js/gamelogic.js). Two modes:
 *
 *   OFFLINE (default): actions are applied locally and mirrored to other tabs on
 *   this machine via BroadcastChannel. `mySeatId` is local, so each tab reveals
 *   only its own hand — hidden hands across tabs.
 *
 *   ONLINE: call connect(host, room). Actions are sent to the PartyKit server,
 *   which is the authority: it applies them, then pushes each connection a
 *   snapshot with the OTHER seats' hands stripped out (see GameLogic.redactFor).
 *   That is what makes hands private across separate devices.
 */
const GS_STORE_KEY = 'board_game_state';
const GS_SEAT_KEY = 'board_game_my_seat';
const GS_CHANNEL = 'board_game_sync';

class GameState {
    constructor() {
        this.listeners = new Set();
        this.mySeatId = localStorage.getItem(GS_SEAT_KEY) || null;   // local-only identity
        this.state = this._load() || GameLogic.empty();
        this.online = false;
        this.conn = null;
        this.wanted = false;      // whether we want to stay connected (for reconnect)
        this.status = 'offline';  // offline | connecting | online | error
        this.bc = ('BroadcastChannel' in window) ? new BroadcastChannel(GS_CHANNEL) : null;
        if (this.bc) this.bc.onmessage = (e) => this._onLocalPeer(e.data);
    }

    // ---- persistence / listeners -----------------------------------------
    _load() { try { const r = localStorage.getItem(GS_STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
    _persist() { try { localStorage.setItem(GS_STORE_KEY, JSON.stringify(this.state)); } catch (e) {} }
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _emit() { this.listeners.forEach(fn => { try { fn(this.state); } catch (e) { console.error(e); } }); }

    setMySeat(seatId) {
        this.mySeatId = seatId;
        if (seatId) localStorage.setItem(GS_SEAT_KEY, seatId); else localStorage.removeItem(GS_SEAT_KEY);
        if (this.online && this.conn && this.conn.readyState === 1) this.conn.send(JSON.stringify({ t: 'seat', seatId }));
        this._emit();
    }

    // ---- the one path every mutation goes through ------------------------
    dispatch(action) {
        if (this.online) {
            if (this.conn && this.conn.readyState === 1) this.conn.send(JSON.stringify({ t: 'action', action }));
            return;   // server is authoritative; it will push back a snapshot
        }
        this.state = GameLogic.apply(this.state, action, window.GAME_DATA);
        this._persist();
        this._emit();
        if (this.bc) this.bc.postMessage({ t: 'state', state: this.state });
    }

    _onLocalPeer(msg) {
        if (msg && msg.t === 'state' && msg.state && msg.state.rev > (this.state.rev || 0)) {
            this.state = msg.state; this._persist(); this._emit();
        }
    }

    _adoptServer(snap) {          // authoritative, already redacted for my seat
        this.state = snap; this._persist(); this._emit();
    }

    // ---- online connection (PartyKit) ------------------------------------
    connect(host, room) {
        this.wanted = true;
        this._host = host.replace(/^wss?:\/\//, '').replace(/\/$/, '');
        this._room = room || 'table-1';
        this._open();
    }
    _open() {
        const isLocal = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(this._host);
        const proto = isLocal ? 'ws' : 'wss';
        const url = `${proto}://${this._host}/parties/main/${encodeURIComponent(this._room)}`;
        this.status = 'connecting'; this._emit();
        let ws;
        try { ws = new WebSocket(url); } catch (e) { this.status = 'error'; this._emit(); return; }
        this.conn = ws;
        ws.onopen = () => {
            this.online = true; this.status = 'online';
            ws.send(JSON.stringify({ t: 'hello', seatId: this.mySeatId }));
            this._emit();
        };
        ws.onmessage = (e) => {
            let m; try { m = JSON.parse(e.data); } catch (_) { return; }
            if (m.t === 'snapshot' && m.state) this._adoptServer(m.state);
        };
        ws.onclose = () => {
            this.online = false; this.conn = null;
            this.status = this.wanted ? 'connecting' : 'offline';
            this._emit();
            if (this.wanted) setTimeout(() => { if (this.wanted) this._open(); }, 2000);
        };
        ws.onerror = () => { this.status = 'error'; this._emit(); };
    }
    disconnect() {
        this.wanted = false; this.online = false; this.status = 'offline';
        if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
        this.state = this._load() || GameLogic.empty();
        this._emit();
    }

    // ---- read helpers (used by the HUD) ----------------------------------
    seat(id) { return this.state.seats.find(s => s.id === id); }
    character(seat) { const d = window.GAME_DATA; return d && seat ? (seat.kind === 'monster' ? d.monsters : d.heroes).find(c => c.id === seat.characterId) || null : null; }
    card(cid) { return (window.GAME_DATA.cards || []).find(c => c.id === cid); }

    // ---- action wrappers (thin; all funnel through dispatch) -------------
    newGame() { this.dispatch({ type: 'NEW_GAME' }); }
    resetGame() { this.dispatch({ type: 'RESET' }); }
    draw(seatId, deck) { this.dispatch({ type: 'DRAW', seatId, deck }); }
    discard(seatId, iid) { this.dispatch({ type: 'DISCARD', seatId, iid }); }
    playCard(seatId, iid) { this.dispatch({ type: 'PLAY_CARD', seatId, iid }); }
    togglePhase() { this.dispatch({ type: 'SET_PHASE', phase: this.state.phase === 'heroes' ? 'monster' : 'heroes' }); }
    setSeatCharacter(seatId, characterId) { this.dispatch({ type: 'SET_CHARACTER', seatId, characterId }); }
    score(delta, seatId) { this.dispatch({ type: 'SCORE', delta, seatId }); }
    setGoal(goal) { this.dispatch({ type: 'SET_GOAL', goal }); }
    log(text, seatId) { this.dispatch({ type: 'LOG', text, seatId }); }
    rollDice(seatId, dieList, kind, flat, flatFrom) { this.dispatch({ type: 'ROLL_DICE', seatId, dieList, kind, flat, flatFrom }); }
    rollGrid(seatId, cols, rows, axis, value) { this.dispatch({ type: 'ROLL_GRID', seatId, cols, rows, axis, value }); }
    movePiece(seatId, x, y) { this.dispatch({ type: 'MOVE_PIECE', seatId, x, y }); }
    adjustHp(seatId, delta) { this.dispatch({ type: 'ADJUST_HP', seatId, delta }); }
    kill(seatId) { this.dispatch({ type: 'KILL', seatId }); }
    reviveTick(seatId, amount) { this.dispatch({ type: 'REVIVE_TICK', seatId, amount }); }
    setForm(seatId, form, temp) { this.dispatch({ type: 'SET_FORM', seatId, form, temp }); }
    setBoard(board) { this.dispatch({ type: 'SET_BOARD', board }); }
    attack(attackerId, defenderId, cols, rows, via) { this.dispatch({ type: 'COMBAT', attackerId, defenderId, cols, rows, via }); }
    addMinion(opts) { this.dispatch(Object.assign({ type: 'ADD_MINION' }, opts)); }
    addClone(x, y) { this.dispatch({ type: 'ADD_CLONE', x, y }); }
    removeMinion(id) { this.dispatch({ type: 'REMOVE_MINION', id }); }
    adjustMinion(id, stat, delta) { this.dispatch({ type: 'ADJUST_MINION', id, stat, delta }); }
    addMod(seatId, mod) { this.dispatch({ type: 'ADD_MOD', seatId, mod }); }
    clearMod(seatId, id) { this.dispatch({ type: 'CLEAR_MODS', seatId, id }); }
    minion(id) { return (this.state.minions || []).find(m => m.id === id); }
    combatant(id) { return this.seat(id) || this.minion(id); }
}
