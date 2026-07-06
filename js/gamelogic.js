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

    function empty() { return { rev: 0, started: false, decks: null, seats: [], minions: [], phase: 'heroes', score: { collected: 0, goal: 0 }, log: [], board: null, lastDice: null, lastGrid: null, lastCombat: null }; }

    const MAX_LOG = 150;
    function logEvent(s, seatId, text) {
        (s.log = s.log || []).push({ id: Date.now() + Math.random(), ts: Date.now(), seatId: seatId || null, text });
        if (s.log.length > MAX_LOG) s.log = s.log.slice(-MAX_LOG);
    }
    const nameOf = (s, seatId) => { const e = combatantOf(s, seatId); return e ? e.label : ''; };
    const cellName = (x, y) => `${(x | 0) + 1}-${String.fromCharCode(65 + (y | 0))}`;
    // A "combatant" is a seat (hero/monster) OR a minion — both can move and fight.
    const combatantOf = (s, id) => (s.seats || []).find(x => x.id === id) || (s.minions || []).find(x => x.id === id) || null;
    // combat die faces: 1-3 = skull ☠, 4-5 = shield 🛡, 6 = blank
    const FORM_COMBAT = { BEAR: [1, 1], TURTLE: [0, 2], CHEETAH: [0, -1], DEER: [0, -1] };
    // A dice-tray/readout color key for a combatant (hero color name, else 'monster').
    function colorKeyOf(ent) { return ent && ent.kind === 'hero' ? ent.color : 'monster'; }
    function combatStats(ent, data) {
        let c;
        if (ent.kind === 'minion') c = { attack: ent.attack, defense: ent.defense, reach: ent.reach || 1, baseAttack: ent.baseAttack, baseShield: ent.baseShield };
        else { const ch = (ent.kind === 'monster' ? data.monsters : data.heroes).find(x => x.id === ent.characterId); c = (ch && ch.combat) || {}; }
        let attack = c.attack || 0, defense = c.defense || 0;
        if (ent.form && FORM_COMBAT[ent.form]) { attack += FORM_COMBAT[ent.form][0]; defense += FORM_COMBAT[ent.form][1]; }
        // baseAttack = flat skulls always dealt; baseShield = flat shields always blocked.
        // (ent.autoSkull/autoShield kept as per-instance one-shot augments from cards.)
        const baseAttack = (c.baseAttack || 0) + (ent.autoSkull || 0);
        const baseShield = (c.baseShield || 0) + (ent.autoShield || 0);
        return { attack: Math.max(0, attack), defense: Math.max(0, defense), reach: c.reach || 1, baseAttack, baseShield };
    }
    function pushAway(mon, from, n, cols, rows) {
        if (mon.x == null || from.x == null) return 0;
        let dx = Math.sign(mon.x - from.x), dy = Math.sign(mon.y - from.y);
        if (dx === 0 && dy === 0) dx = 1;
        let moved = 0;
        for (let i = 0; i < n; i++) {
            const nx = mon.x + dx, ny = mon.y + dy;
            if (nx < 0 || ny < 0 || (cols && nx >= cols) || (rows && ny >= rows)) break;
            mon.x = nx; mon.y = ny; moved++;
        }
        return moved;
    }

    function die(s, ent, data) {
        if (ent.kind === 'minion') {                 // minions are removed, no gravestone
            s.minions = (s.minions || []).filter(m => m.id !== ent.id);
            logEvent(s, null, `${ent.label || 'A minion'} was destroyed`);
            return;
        }
        ent.dead = true; ent.form = null; ent.formTemp = false;
        const ch = (ent.kind === 'monster' ? data.monsters : data.heroes).find(c => c.id === ent.characterId);
        const a1 = (ch && ch.stats && ch.stats.a1) || 4;   // guidebook: roll action die for the revive counter
        ent.grave = { count: 1 + Math.floor(Math.random() * a1) };
        logEvent(s, ent.id, `died — gravestone (revive ${ent.grave.count})`);
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

    // Hook for card effects when a card is *played* (not merely discarded). Most
    // cards' effects aren't wired yet — this is where they'll resolve. A `card.effect`
    // key (structured effect) can be authored later; for now we recognise a couple of
    // simple combat-augment tags so the play/discard split is already meaningful.
    function applyCardEffect(s, seat, card, data) {
        if (!card) return;
        const eff = card.effect || {};
        // one-shot combat augments stored on the seat until consumed by the next attack
        if (eff.autoSkull) seat.autoSkull = (seat.autoSkull || 0) + eff.autoSkull;
        if (eff.autoShield) seat.autoShield = (seat.autoShield || 0) + eff.autoShield;
        // (extend here as card effects are wired in)
    }

    // Apply one action to `state`, returning the next state. `data` is the game
    // content (heroes/monsters/cards). Randomness lives here on purpose.
    function apply(state, action, data) {
        const s = clone(state || empty());
        const a = action || {};
        switch (a.type) {
            case 'NEW_GAME': { const ng = newGame(data); ng.board = (state && state.board) || null; return ng; }  // keep the drawn map
            case 'RESET': { const e = empty(); e.board = (state && state.board) || null; return e; }
            case 'SET_BOARD': s.board = a.board || null; break;
            case 'DRAW': {
                const seat = seatOf(s, a.seatId); const deck = s.decks && s.decks[a.deck || (seat && seat.deck)];
                if (!seat || !deck) break;
                if (!deck.draw.length) { deck.draw = shuffle(deck.discard); deck.discard = []; }
                if (deck.draw.length) { seat.hand.push(deck.draw.pop()); logEvent(s, seat.id, `drew a card`); }
                break;
            }
            case 'DISCARD': case 'PLAY_CARD': {
                const seat = seatOf(s, a.seatId); if (!seat) break;
                const idx = seat.hand.findIndex(c => c && c.iid === a.iid); if (idx < 0) break;
                const [inst] = seat.hand.splice(idx, 1);
                const card = cardOf(data, inst.cid);
                const deck = s.decks[(card && card.deck) || seat.deck] || s.decks[seat.deck];
                if (deck) deck.discard.push(inst);
                if (a.type === 'PLAY_CARD') {
                    s.lastPlayed = { seatId: seat.id, cid: inst.cid, ts: Date.now() };
                    applyCardEffect(s, seat, card, data);   // effect hook (mostly stubbed until wired)
                    logEvent(s, seat.id, `played ${card ? card.name : 'a card'}`);
                } else {
                    logEvent(s, seat.id, `discarded ${card ? card.name : 'a card'}`);
                }
                break;
            }
            case 'SET_PHASE': {
                s.phase = a.phase === 'monster' ? 'monster' : 'heroes';
                (s.seats || []).forEach(seat => { if (seat.formTemp) { seat.form = null; seat.formTemp = false; } });
                logEvent(s, null, s.phase === 'heroes' ? "Heroes' turn" : "Monster's turn");
                break;
            }
            case 'MOVE_PIECE': {
                const ent = combatantOf(s, a.seatId); if (!ent) break;
                ent.x = a.x; ent.y = a.y;
                logEvent(s, ent.kind === 'minion' ? null : ent.id, `${ent.kind === 'minion' ? (ent.label || 'minion') + ' ' : ''}moved to ${cellName(a.x, a.y)}`);
                break;
            }
            case 'ADD_MINION': {
                const n = (s.minions || []).length + 1;
                s.minions = s.minions || [];
                const life = a.hp || (1 + Math.floor(Math.random() * 4));   // d4 health when spawned
                s.minions.push({
                    id: 'min-' + Date.now() + '-' + Math.floor(Math.random() * 1000), kind: 'minion', label: 'Minion ' + n,
                    x: a.x, y: a.y, hp: life, maxHp: life, attack: a.attack || 2, defense: a.defense || 1, reach: a.reach || 1,
                    baseAttack: a.baseAttack || 0, baseShield: a.baseShield || 0, color: a.color || '#9b2d2d',
                });
                logEvent(s, null, `A minion was placed at ${cellName(a.x, a.y)} (❤${life})`);
                break;
            }
            case 'REMOVE_MINION': { s.minions = (s.minions || []).filter(m => m.id !== a.id); break; }
            case 'ADJUST_MINION': {   // tweak/enhance one minion's stats (Oblex buffs, etc.)
                const m = (s.minions || []).find(x => x.id === a.id); if (!m) break;
                const d = a.delta || 0;
                if (a.stat === 'maxHp') { m.maxHp = Math.max(1, (m.maxHp || 1) + d); if (d > 0) m.hp = Math.min(m.maxHp, (m.hp || 0) + d); else m.hp = Math.min(m.hp || 0, m.maxHp); }
                else if (a.stat === 'attack') m.attack = Math.max(0, (m.attack || 0) + d);
                else if (a.stat === 'defense') m.defense = Math.max(0, (m.defense || 0) + d);
                else if (a.stat === 'reach') m.reach = Math.max(1, (m.reach || 1) + d);
                else break;
                logEvent(s, null, `${m.label} ${a.stat} ${d >= 0 ? '+' : ''}${d}`);
                break;
            }
            case 'ADJUST_HP': {
                const ent = combatantOf(s, a.seatId); if (!ent || ent.kind === 'monster' || ent.dead) break;
                const max = ent.maxHp || ent.hp || 10;
                ent.hp = Math.max(0, Math.min(max, (ent.hp || 0) + (a.delta || 0)));
                logEvent(s, ent.kind === 'minion' ? null : ent.id, `${ent.kind === 'minion' ? (ent.label || 'minion') + ' ' : ''}${a.delta >= 0 ? 'gained ' + a.delta : 'took ' + (-a.delta) + ' damage,'} life ${ent.hp}/${max}`);
                if (ent.hp <= 0) die(s, ent, data);
                break;
            }
            case 'KILL': { const ent = combatantOf(s, a.seatId); if (ent && ent.kind !== 'monster' && !ent.dead) { ent.hp = 0; die(s, ent, data); } break; }
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
            case 'COMBAT': {
                const atk = combatantOf(s, a.attackerId), def = combatantOf(s, a.defenderId);
                if (!atk || !def || atk.id === def.id) break;
                const ac = combatStats(atk, data), dc = combatStats(def, data);
                const roll = () => 1 + Math.floor(Math.random() * 6);
                const skulls = f => f.filter(v => v <= 3).length;   // faces 1-3 = ☠
                const shields = f => f.filter(v => v >= 4 && v <= 5).length; // 4-5 = 🛡
                // Both sides roll their own pool: attacker rolls Attack dice, defender
                // rolls Defense dice. EACH side's skulls wound the OTHER; each side's
                // shields block the other's skulls. Damage flows both ways.
                const atkFaces = Array.from({ length: Math.max(0, ac.attack) + (a.bonusAttack || 0) }, roll);
                const defFaces = Array.from({ length: Math.max(0, dc.defense) + (a.bonusDefense || 0) }, roll);
                const atkSkulls = skulls(atkFaces) + ac.baseAttack;   // hits the attacker deals
                const atkShields = shields(atkFaces) + ac.baseShield; // blocks the attacker has
                const defSkulls = skulls(defFaces) + dc.baseAttack;   // hits the defender deals back
                const defShields = shields(defFaces) + dc.baseShield; // blocks the defender has
                const woundsToDef = Math.max(0, atkSkulls - defShields);
                const woundsToAtk = Math.max(0, defSkulls - atkShields);

                // Apply wounds to a fighter: the monster can't be killed (heroes shove
                // it back instead); heroes/minions lose HP → gravestone/removal.
                const applyWounds = (target, from, wounds) => {
                    if (wounds <= 0) return 0;
                    if (target.kind === 'monster') return pushAway(target, from, wounds, a.cols, a.rows);
                    target.hp = Math.max(0, (target.hp || 0) - wounds);
                    if (target.hp <= 0 && !target.dead) die(s, target, data);
                    return 0;
                };
                const repelDef = applyWounds(def, atk, woundsToDef);
                const repelAtk = applyWounds(atk, def, woundsToAtk);

                s.lastCombat = {
                    attackerId: atk.id, defenderId: def.id, atkFaces, defFaces,
                    atkKey: colorKeyOf(atk), defKey: colorKeyOf(def),
                    atkSkulls, atkShields, defSkulls, defShields,
                    woundsToDef, woundsToAtk, repelDef, repelAtk, ts: Date.now(),
                };
                const dmgOut = (target, wounds, repel) => target.kind === 'monster'
                    ? (repel ? `pushed back ${repel}` : 'held ground')
                    : (wounds ? `${wounds} wound${wounds !== 1 ? 's' : ''}` : 'no damage');
                logEvent(s, atk.id, `attacks ${def.label} — ${atkSkulls}☠/${atkShields}🛡 vs ${defSkulls}☠/${defShields}🛡 → ` +
                    `${def.label} ${dmgOut(def, woundsToDef, repelDef)}, ${atk.label} ${dmgOut(atk, woundsToAtk, repelAtk)}`);
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
