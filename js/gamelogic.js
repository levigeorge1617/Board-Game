/*
 * GameLogic — the single source of truth for how the game state changes.
 * Pure-ish reducer shared by BOTH the browser client (js/gamestate.js) and the
 * multiplayer server (party/server.js), so online and offline behave identically
 * and all randomness (dice, shuffles) happens in exactly one place.
 *
 * Loaded as a classic script in the browser (sets globalThis.GameLogic) and
 * imported for its side effect by the PartyKit server.
 */
(function (g) {
    function clone(s) { return JSON.parse(JSON.stringify(s)); }
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    const HERO_COLORS = ['RED', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'];

    function empty() { return { rev: 0, started: false, decks: null, seats: [], phase: 'heroes', score: { collected: 0, goal: 0 }, log: [], lastDice: null, lastGrid: null }; }

    const MAX_LOG = 150;
    function logEvent(s, seatId, text) {
        (s.log = s.log || []).push({ id: Date.now() + Math.random(), ts: Date.now(), seatId: seatId || null, text });
        if (s.log.length > MAX_LOG) s.log = s.log.slice(-MAX_LOG);
    }
    const nameOf = (s, seatId) => { const seat = (s.seats || []).find(x => x.id === seatId); return seat ? seat.label : ''; };
    const cellName = (x, y) => `${(x | 0) + 1}-${String.fromCharCode(65 + (y | 0))}`;
    function die(s, seat, data) {
        seat.dead = true; seat.form = null; seat.formTemp = false;
        const ch = (seat.kind === 'monster' ? data.monsters : data.heroes).find(c => c.id === seat.characterId);
        const a1 = (ch && ch.stats && ch.stats.a1) || 4;   // guidebook: roll action die for the revive counter
        seat.grave = { count: 1 + Math.floor(Math.random() * a1) };
        logEvent(s, seat.id, `died — gravestone (revive ${seat.grave.count})`);
    }

    function newGame(data) {
        const state = empty();
        const buildDeck = (deckName) => {
            const pile = [];
            (data.cards || []).filter(c => c.deck === deckName).forEach(c => {
                for (let i = 0; i < (c.copies || 1); i++)
                    pile.push({ iid: `${c.id}-${i}-${Math.random().toString(36).slice(2, 7)}`, cid: c.id });
            });
            return shuffle(pile);
        };
        state.decks = { White: { draw: buildDeck('White'), discard: [] }, Black: { draw: buildDeck('Black'), discard: [] } };

        const byColor = {};
        (data.heroes || []).forEach(h => { if (!byColor[h.color] || h.cardFace === 'front') byColor[h.color] = h; });
        const seats = [];
        let i = 0;
        HERO_COLORS.forEach(col => {
            const h = byColor[col]; if (!h) return;
            const life = (h.stats && h.stats.life) || 10;
            seats.push({
                id: 'seat-' + col.toLowerCase(), label: h.name, kind: 'hero', deck: 'White', color: col, characterId: h.id, hand: [],
                x: 2 + i, y: 6, hp: life, maxHp: life, dead: false, grave: null, form: null, formTemp: false,
            });
            i++;
        });
        const mon = (data.monsters || [])[0];
        seats.push({ id: 'seat-monster', label: mon ? mon.name : 'Monster', kind: 'monster', deck: 'Black', color: 'MONSTER', characterId: mon ? mon.id : null, hand: [], x: 4, y: 9 });

        state.seats = seats;
        state.phase = 'heroes';
        state.started = true;
        logEvent(state, null, 'Table dealt — heroes go first.');
        return state;
    }

    const seatOf = (s, id) => s.seats.find(x => x.id === id);
    const charOf = (data, seat) => seat && (seat.kind === 'monster' ? data.monsters : data.heroes).find(c => c.id === seat.characterId);
    const cardOf = (data, cid) => (data.cards || []).find(c => c.id === cid);

    // Apply one action to `state`, returning the next state. `data` is the game
    // content (heroes/monsters/cards). Randomness lives here on purpose.
    function apply(state, action, data) {
        const s = clone(state || empty());
        const a = action || {};
        switch (a.type) {
            case 'NEW_GAME': return newGame(data);
            case 'RESET': return empty();
            case 'DRAW': {
                const seat = seatOf(s, a.seatId); const deck = s.decks && s.decks[a.deck || (seat && seat.deck)];
                if (!seat || !deck) break;
                if (!deck.draw.length) { deck.draw = shuffle(deck.discard); deck.discard = []; }
                if (deck.draw.length) { seat.hand.push(deck.draw.pop()); logEvent(s, seat.id, `drew a card`); }
                break;
            }
            case 'DISCARD': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                const idx = seat.hand.findIndex(c => c && c.iid === a.iid); if (idx < 0) break;
                const [inst] = seat.hand.splice(idx, 1);
                const card = cardOf(data, inst.cid);
                const deck = s.decks[(card && card.deck) || seat.deck] || s.decks[seat.deck];
                if (deck) deck.discard.push(inst);
                logEvent(s, seat.id, `played ${card ? card.name : 'a card'}`);
                break;
            }
            case 'SET_PHASE': {
                s.phase = a.phase === 'monster' ? 'monster' : 'heroes';
                (s.seats || []).forEach(seat => { if (seat.formTemp) { seat.form = null; seat.formTemp = false; } });
                logEvent(s, null, s.phase === 'heroes' ? "Heroes' turn" : "Monster's turn");
                break;
            }
            case 'MOVE_PIECE': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                seat.x = a.x; seat.y = a.y;
                logEvent(s, seat.id, `moved to ${cellName(a.x, a.y)}`);
                break;
            }
            case 'ADJUST_HP': {
                const seat = seatOf(s, a.seatId); if (!seat || seat.kind !== 'hero' || seat.dead) break;
                const max = seat.maxHp || seat.hp || 10;
                seat.hp = Math.max(0, Math.min(max, (seat.hp || 0) + (a.delta || 0)));
                logEvent(s, seat.id, `${a.delta >= 0 ? 'gained ' + a.delta : 'took ' + (-a.delta) + ' damage,'} life ${seat.hp}/${max}`);
                if (seat.hp <= 0) die(s, seat, data);
                break;
            }
            case 'KILL': { const seat = seatOf(s, a.seatId); if (seat && seat.kind === 'hero' && !seat.dead) { seat.hp = 0; die(s, seat, data); } break; }
            case 'REVIVE_TICK': {
                const seat = seatOf(s, a.seatId); if (!seat || !seat.dead || !seat.grave) break;
                seat.grave.count = Math.max(0, seat.grave.count - (a.amount || 1));
                if (seat.grave.count <= 0) { seat.dead = false; seat.grave = null; seat.hp = Math.min(4, seat.maxHp || 4); logEvent(s, seat.id, 'was revived (life 4)'); }
                else logEvent(s, seat.id, `revive progress (${seat.grave.count} to go)`);
                break;
            }
            case 'SET_FORM': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                seat.form = a.form || null; seat.formTemp = !!a.temp;
                logEvent(s, seat.id, a.form ? `transformed → ${a.form}${a.temp ? ' (this turn)' : ''}` : 'reverted to normal');
                break;
            }
            case 'SET_CHARACTER': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                seat.characterId = a.characterId;
                const c = charOf(data, seat); if (c) seat.label = c.name;
                logEvent(s, seat.id, `is now ${c ? c.name : 'a new character'}`);
                break;
            }
            case 'SCORE': {
                s.score = s.score || { collected: 0, goal: 0 };
                s.score.collected = Math.max(0, (s.score.collected || 0) + (a.delta || 0));
                logEvent(s, a.seatId || null, `${a.delta >= 0 ? 'collected an objective' : 'removed an objective'} (${s.score.collected}${s.score.goal ? '/' + s.score.goal : ''})`);
                break;
            }
            case 'SET_GOAL': { s.score = s.score || { collected: 0, goal: 0 }; s.score.goal = Math.max(0, a.goal || 0); break; }
            case 'ROLL_DICE': {
                const rolls = (a.dieList || []).filter(d => d.die).map(d => ({ key: d.key, die: d.die, value: 1 + Math.floor(Math.random() * d.die) }));
                s.lastDice = { seatId: a.seatId, rolls, total: rolls.reduce((n, r) => n + r.value, 0), ts: Date.now() };
                logEvent(s, a.seatId, `rolled ${rolls.map(r => `d${r.die}=${r.value}`).join(', ')}${rolls.length > 1 ? ` (total ${s.lastDice.total})` : ''}`);
                break;
            }
            case 'ROLL_GRID': {
                const col = 1 + Math.floor(Math.random() * Math.max(1, a.cols || 1));
                const row = String.fromCharCode(65 + Math.floor(Math.random() * Math.max(1, a.rows || 1)));
                s.lastGrid = { col, row, ts: Date.now() };
                logEvent(s, a.seatId || 'seat-monster', `rolled grid target ${col}-${row}`);
                break;
            }
            case 'LOG': logEvent(s, a.seatId || null, a.text || ''); break;
        }
        s.rev = (state && state.rev || 0) + 1;
        return s;
    }

    // Return a copy where every hand except `seatId` is hidden (replaced by nulls
    // preserving count). The server runs this per-connection so a player's cards
    // never leave the server toward anyone else.
    function redactFor(state, seatId) {
        const s = clone(state);
        (s.seats || []).forEach(seat => { if (seat.id !== seatId) seat.hand = seat.hand.map(() => null); });
        return s;
    }

    g.GameLogic = { empty, newGame, apply, redactFor, seatOf, charOf, cardOf, shuffle };
})(typeof globalThis !== 'undefined' ? globalThis : this);
