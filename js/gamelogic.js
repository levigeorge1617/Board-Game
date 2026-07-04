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

    function empty() { return { rev: 0, started: false, decks: null, seats: [], activeSeatId: null, lastDice: null, lastGrid: null }; }

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
        HERO_COLORS.forEach(col => {
            const h = byColor[col]; if (!h) return;
            seats.push({ id: 'seat-' + col.toLowerCase(), label: h.name, kind: 'hero', deck: 'White', color: col, characterId: h.id, hand: [] });
        });
        const mon = (data.monsters || [])[0];
        seats.push({ id: 'seat-monster', label: mon ? mon.name : 'Monster', kind: 'monster', deck: 'Black', color: 'MONSTER', characterId: mon ? mon.id : null, hand: [] });

        state.seats = seats;
        state.activeSeatId = seats[0] ? seats[0].id : null;
        state.started = true;
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
                if (deck.draw.length) seat.hand.push(deck.draw.pop());
                break;
            }
            case 'DISCARD': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                const idx = seat.hand.findIndex(c => c && c.iid === a.iid); if (idx < 0) break;
                const [inst] = seat.hand.splice(idx, 1);
                const card = cardOf(data, inst.cid);
                const deck = s.decks[(card && card.deck) || seat.deck] || s.decks[seat.deck];
                if (deck) deck.discard.push(inst);
                break;
            }
            case 'SET_ACTIVE': s.activeSeatId = a.seatId; break;
            case 'NEXT_TURN': {
                const i = s.seats.findIndex(x => x.id === s.activeSeatId);
                if (s.seats.length) s.activeSeatId = s.seats[(i + 1) % s.seats.length].id;
                break;
            }
            case 'SET_CHARACTER': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                seat.characterId = a.characterId;
                const c = charOf(data, seat); if (c) seat.label = c.name;
                break;
            }
            case 'ROLL_DICE': {
                const rolls = (a.dieList || []).filter(d => d.die).map(d => ({ key: d.key, die: d.die, value: 1 + Math.floor(Math.random() * d.die) }));
                s.lastDice = { seatId: a.seatId, rolls, total: rolls.reduce((n, r) => n + r.value, 0), ts: Date.now() };
                break;
            }
            case 'ROLL_GRID': {
                const col = 1 + Math.floor(Math.random() * Math.max(1, a.cols || 1));
                const row = String.fromCharCode(65 + Math.floor(Math.random() * Math.max(1, a.rows || 1)));
                s.lastGrid = { col, row, ts: Date.now() };
                break;
            }
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
