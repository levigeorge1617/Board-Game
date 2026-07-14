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
    // Druid form → [attack dice delta, defense dice delta] applied to the pool.
    const FORM_COMBAT = { BEAR: [1, 1], TURTLE: [0, 2], CHEETAH: [0, -1], DEER: [0, -1] };
    // A dice-tray/readout color key for a combatant (hero color name, else 'monster').
    function colorKeyOf(ent) {
        if (!ent) return 'monster';
        if (ent.kind === 'hero') return ent.color;
        if (ent.pet) return ent.ownerColor || 'YELLOW';   // a hero-side pet rolls in its owner's colour
        return 'monster';
    }

    // ---- objective-scaled ("ladder") stats --------------------------------
    // Several monster numbers GROW as heroes collect objectives. A ladder is
    // [{ at, <key> }, …]; the effective value is the highest entry whose `at`
    // threshold the current objective count has reached (never below `base`).
    function ladderValue(base, ladder, score, key) {
        let v = base || 0;
        (ladder || []).forEach(step => { if ((score || 0) >= (step.at || 0)) v = Math.max(v, step[key] || 0); });
        return v;
    }
    const scoreOf = s => (s && s.score && s.score.collected) || 0;
    const monsterCharOf = (s, data) => { const seat = (s.seats || []).find(x => x.kind === 'monster'); return seat && (data.monsters || []).find(m => m.id === seat.characterId) || null; };
    // Oblex auto-buffs its whole swarm off its own objective ladder — every minion
    // gets these for free, no per-minion tweaking. { attack, reach } deltas.
    // Only Oblex's OWN swarm is buffable — not a hero's pet, a barrier, or a clone.
    const oblexBuffable = ent => ent && ent.kind === 'minion' && !ent.clone && !ent.pet && !ent.barrier && ent.side !== 'hero';
    function oblexMinionBonus(monChar, score, ent) {
        if (!monChar || monChar.id !== 'oblex' || (ent && !oblexBuffable(ent))) return { attack: 0, reach: 0 };
        return {
            attack: (score >= 4 ? 1 : 0) + (score >= 7 ? 1 : 0),   // 4◆ +1, 7◆ +1
            reach: (score >= 6 ? 1 : 0),                            // 6◆ +1
        };
    }
    // Effective SIGHT (how far a piece can SEE an enemy) and REACH (how far it can
    // ATTACK), both objective-scaled. Sight ≥ reach. Heroes default to a fixed
    // sight; minions see short unless Oblex extends their reach.
    const DEFAULT_SIGHT = 6;
    const FLEE_BASE = 2;   // shields a hero must roll to flee, before hero/monster modifiers
    // Resolve the character sheet a piece fights with (clone/monster → a monster,
    // hero → a hero); plain minions have no sheet.
    function charSheetOf(ent, data) {
        if (!ent) return null;
        if (ent.clone || ent.kind === 'monster') return (data.monsters || []).find(m => m.id === ent.characterId) || null;
        if (ent.kind === 'hero') return (data.heroes || []).find(h => h.id === ent.characterId) || null;
        return null;
    }
    function effectiveReach(ent, data, score, monChar) {
        if (!ent) return 1;
        const ch = charSheetOf(ent, data);
        if (!ch) return Math.max(1, (ent.reach || 1) + oblexMinionBonus(monChar, score, ent).reach);   // plain minion
        const c = ch.combat || {};
        return Math.max(1, ladderValue(c.reach || 1, c.reachLadder, score, 'reach'));
    }
    function effectiveSight(ent, data, score, monChar) {
        if (!ent) return DEFAULT_SIGHT;
        const ch = charSheetOf(ent, data);
        if (!ch) return effectiveReach(ent, data, score, monChar);   // a minion sees only as far as it reaches
        const st = ch.stats || {};
        return Math.max(1, ladderValue(st.sight || DEFAULT_SIGHT, st.sightLadder, score, 'sight'));
    }
    // Maraurn'Zol's meteor blast radius (0 = single cell) at the current score.
    function effectiveBlast(ent, data, score) {
        const ch = charSheetOf(ent, data);
        return ch ? ladderValue(0, (ch.combat || {}).blastLadder, score, 'radius') : 0;
    }

    // A clone fights with the monster's own kit, not a minion's stat block.
    const cloneChar = (ent, data) => ent.clone ? (data.monsters || []).find(m => m.id === ent.characterId) : null;
    // `via` = how a monster engaged: 'grid' (a grid-roll strike) or 'move' (moved
    // into reach). A monster may have a different moveAttack (some hit hard on the
    // grid, weaker when moving, or vice versa). Heroes ignore `via`.
    function combatStats(ent, data, score, monChar, via) {
        let c, attack, defense;
        const monAttack = () => (via === 'move' && c.moveAttack != null)
            ? c.moveAttack : ladderValue(c.attack || 0, c.attackLadder, score, 'attack');
        const clc = cloneChar(ent, data);
        if (clc) {
            c = clc.combat || {};
            attack = monAttack();
            defense = c.defense || 0;
        } else if (ent.kind === 'minion') {
            const b = oblexMinionBonus(monChar, score || 0, ent);
            attack = (ent.attack || 0) + b.attack; defense = ent.defense || 0;
            c = { reach: (ent.reach || 1) + b.reach, baseAttack: ent.baseAttack, baseShield: ent.baseShield };
        } else {
            const ch = (ent.kind === 'monster' ? data.monsters : data.heroes).find(x => x.id === ent.characterId);
            c = (ch && ch.combat) || {};
            // monster attack/reach can climb the objective ladder (e.g. Ghathag's
            // permanent bruise, the Fog's growing reach)
            attack = monAttack();
            defense = c.defense || 0;
        }
        if (ent.form && FORM_COMBAT[ent.form]) { attack += FORM_COMBAT[ent.form][0]; defense += FORM_COMBAT[ent.form][1]; }
        // clones/monsters/heroes climb their reach ladder; plain minions use their (buffed) reach as-is
        const reach = (ent.kind === 'minion' && !clc) ? (c.reach || 1) : ladderValue(c.reach || 1, c.reachLadder, score, 'reach');
        // baseAttack = flat skulls always dealt; baseShield = flat shields always blocked.
        // (ent.autoSkull/autoShield kept as per-instance one-shot augments from cards.)
        const baseAttack = (c.baseAttack || 0) + (ent.autoSkull || 0);
        const baseShield = (c.baseShield || 0) + (ent.autoShield || 0);
        return { attack: Math.max(0, attack), defense: Math.max(0, defense), reach: Math.max(1, reach), baseAttack, baseShield };
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

    // ==================== ROLL / COMBAT MODIFIERS =========================
    // Cards, abilities and terrain can queue "modifiers" onto a combatant. Each
    // modifier is held on `ent.mods` until the roll it targets happens, then it is
    // applied and (for one-shot effects) consumed. Multiple stack. A modifier is:
    //   { id, source, scope, flat, dice:[{die,key}], attackDice, defenseDice,
    //     skull, shield, duration:'once'|'turn'|'persist' }
    //   scope: 'action' | 'move' | 'attack' | 'defense' | 'any'
    //     • flat / dice apply to matching action/move ROLLS
    //     • attackDice/defenseDice/skull/shield apply in COMBAT
    //   duration: 'once' → consumed by the first matching roll; 'turn' → lasts until
    //     the end of the turn (cleared on phase change); 'persist' → permanent.
    const SCOPE_ROLL = { action: 1, move: 1, any: 1 };
    function modId() { return 'mod-' + Date.now() + '-' + Math.floor(Math.random() * 1e5); }
    function addMod(s, seatId, mod) {
        const ent = combatantOf(s, seatId); if (!ent || !mod) return;
        ent.mods = ent.mods || [];
        ent.mods.push(Object.assign({ id: modId(), duration: 'once', scope: 'any' }, mod));
    }
    // A modifier applies to a die roll of `kind` (action/move) if its scope matches
    // and it actually carries a roll effect (flat bonus or extra dice).
    function modAffectsRoll(m, kind) {
        if (!(m.flat || (m.dice && m.dice.length))) return false;
        return m.scope === kind || (m.scope === 'any' && SCOPE_ROLL[kind]);
    }
    const modAffectsAttack = m => (m.attackDice || m.skull) && (m.scope === 'attack' || m.scope === 'any');
    const modAffectsDefense = m => (m.defenseDice || m.shield) && (m.scope === 'defense' || m.scope === 'any');
    // Infer a roll kind from the dice keys when the caller didn't pass one.
    function rollKindOf(dieList) {
        const keys = (dieList || []).map(d => d.key || '');
        if (keys.length && keys.every(k => /^(m|bm|move)/.test(k))) return 'move';
        if (keys.length && keys.every(k => /^(a|ba|die)/.test(k))) return 'action';
        return 'any';
    }
    function describeMod(m) {
        const bits = [];
        if (m.flat) bits.push((m.flat >= 0 ? '+' : '') + m.flat + ' ' + m.scope);
        (m.dice || []).forEach(d => bits.push('+d' + d.die + ' ' + m.scope));
        if (m.attackDice) bits.push('+' + m.attackDice + ' attack die');
        if (m.defenseDice) bits.push('+' + m.defenseDice + ' defense die');
        if (m.skull) bits.push('+' + m.skull + '☠');
        if (m.shield) bits.push('+' + m.shield + '🛡');
        return bits.join(', ') || 'effect';
    }
    // Translate a played card into one or more modifiers. Prefers a structured
    // `card.effect` (authored in the Designer); otherwise infers from the classic
    // "+N to your next action/movement roll" card text so existing cards work.
    function cardMods(card) {
        if (!card) return [];
        const src = card.name || 'card';
        const e = card.effect;
        if (e && (e.flat || e.extraDie || e.attackDice || e.defenseDice || e.skull || e.shield)) {
            const mod = { source: src, scope: e.scope || 'any', duration: e.duration || 'once' };
            if (e.flat) mod.flat = Number(e.flat);
            if (e.extraDie) mod.dice = [{ die: Number(e.extraDie), key: 'mod' }];
            if (e.attackDice) mod.attackDice = Number(e.attackDice);
            if (e.defenseDice) mod.defenseDice = Number(e.defenseDice);
            if (e.skull) mod.skull = Number(e.skull);
            if (e.shield) mod.shield = Number(e.shield);
            return [mod];
        }
        // --- text inference for the shipped cards ---
        const name = src, text = card.text || '';
        const both = /movement and your next action|next action and.*movement/i.test(text) || /aggressive sprint/i.test(name);
        const num = (re, s) => { const m = (s || '').match(re); return m ? parseInt(m[1], 10) : 0; };
        let n;
        if (both) {
            n = num(/\+\s*(\d+)/, text) || 2;
            return [{ source: src, scope: 'action', flat: n, duration: 'once' }, { source: src, scope: 'move', flat: n, duration: 'once' }];
        }
        if (/spell\s*book/i.test(name) || /next action roll by\s*\+?(\d+)/i.test(text)) {
            n = num(/spell\s*book\s*\+?(\d+)/i, name) || num(/\+?(\d+)/, name) || num(/by\s*\+?(\d+)/i, text) || 1;
            return [{ source: src, scope: 'action', flat: n, duration: 'once' }];   // "next action roll"
        }
        if (/boots?/i.test(name) || /next movement roll by\s*\+?(\d+)/i.test(text)) {
            n = num(/boots?\s*\+?(\d+)/i, name) || num(/\+?(\d+)/, name) || num(/by\s*\+?(\d+)/i, text) || 2;
            return [{ source: src, scope: 'move', flat: n, duration: 'once' }];   // "next movement roll"
        }
        return [];
    }
    // Hook for card effects when a card is *played* (not merely discarded).
    function applyCardEffect(s, seat, card, data) {
        cardMods(card).forEach(mod => { addMod(s, seat.id, mod); logEvent(s, seat.id, `${card.name}: ${describeMod(mod)}`); });
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
            case 'GIVE_CARD': {
                const from = seatOf(s, a.seatId), to = seatOf(s, a.toSeatId);
                if (!from || !to || from.id === to.id) break;
                const idx = from.hand.findIndex(c => c && c.iid === a.iid); if (idx < 0) break;
                const [inst] = from.hand.splice(idx, 1);
                to.hand.push(inst);
                const card = cardOf(data, inst.cid);
                logEvent(s, from.id, `gave ${card ? card.name : 'a card'} to ${to.label}`);
                break;
            }
            case 'SET_PHASE': {
                s.phase = a.phase === 'monster' ? 'monster' : 'heroes';
                (s.seats || []).forEach(seat => { if (seat.formTemp) { seat.form = null; seat.formTemp = false; } });
                // "one turn only" modifiers (once/turn) expire at the turn boundary; persistent stay
                (s.seats || []).concat(s.minions || []).forEach(e => { if (e.mods) e.mods = e.mods.filter(m => m.duration === 'persist'); });
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
                const n = (s.minions || []).filter(m => !m.barrier && !m.clone).length + 1;
                s.minions = s.minions || [];
                const life = a.hp || (1 + Math.floor(Math.random() * 4));   // d4 health when spawned
                const barrier = !!a.barrier, pet = !!a.pet, side = a.side === 'hero' ? 'hero' : 'monster';
                s.minions.push({
                    id: (barrier ? 'bar-' : pet ? 'pet-' : 'min-') + Date.now() + '-' + Math.floor(Math.random() * 1000), kind: 'minion',
                    barrier, pet, side, ownerColor: a.ownerColor || null, label: a.label || (barrier ? 'Barrier' : pet ? 'Pet' : 'Minion ' + n),
                    x: a.x, y: a.y, hp: life, maxHp: life,
                    attack: barrier ? 0 : (a.attack || 2), defense: a.defense || (barrier ? 0 : 1), reach: a.reach || 1,
                    baseAttack: a.baseAttack || 0, baseShield: a.baseShield || 0,
                    color: a.color || (barrier ? '#6b6f74' : pet ? '#d9a520' : '#9b2d2d'),
                });
                logEvent(s, null, `${barrier ? 'A barrier' : pet ? 'A pet' : 'A minion'} was placed at ${cellName(a.x, a.y)} (❤${life})`);
                break;
            }
            case 'ADD_CLONE': {
                // Maraurn'Zol's clone: a second monster piece. It lives in `minions`
                // (so it moves/attacks like any piece) but carries the monster's
                // characterId + combat and `clone:true`, so it can't be killed
                // (heroes shove it back) and renders with her art.
                const mon = (s.seats || []).find(x => x.kind === 'monster'); if (!mon) break;
                s.minions = s.minions || [];
                const n = (s.minions || []).filter(m => m.clone).length + 1;
                s.minions.push({
                    id: 'clone-' + Date.now() + '-' + Math.floor(Math.random() * 1000), kind: 'minion', clone: true,
                    characterId: mon.characterId, label: (mon.label || 'Monster') + ' (clone' + (n > 1 ? ' ' + n : '') + ')',
                    x: a.x != null ? a.x : mon.x, y: a.y != null ? a.y : mon.y, color: '#5c1020',
                });
                logEvent(s, null, `A clone of ${mon.label} appeared`);
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
                const ent = combatantOf(s, a.seatId);
                const kind = a.kind || rollKindOf(a.dieList);
                // pull in modifiers that target this kind of roll (flat bonuses + extra dice)
                const mods = ent ? (ent.mods || []).filter(m => modAffectsRoll(m, kind)) : [];
                const dieList = (a.dieList || []).slice();
                mods.forEach(m => (m.dice || []).forEach(d => dieList.push({ key: d.key || 'mod', die: d.die, from: m.source })));
                const rolls = dieList.filter(d => d.die).map(d => ({ key: d.key, die: d.die, value: 1 + Math.floor(Math.random() * d.die), from: d.from }));
                // a.flat = a caller-supplied flat bonus (e.g. the Fog's +2 to movement)
                const flat = mods.reduce((n, m) => n + (m.flat || 0), 0) + (a.flat || 0);
                const diceTotal = rolls.reduce((n, r) => n + r.value, 0);
                const modsApplied = mods.map(m => ({ source: m.source, flat: m.flat || 0, dice: (m.dice || []).length }));
                if (a.flat) modsApplied.push({ source: a.flatFrom || 'bonus', flat: a.flat, dice: 0 });
                s.lastDice = { seatId: a.seatId, kind, rolls, flat, modsApplied, total: diceTotal + flat, ts: Date.now() };
                // consume one-shot modifiers that just fired
                if (ent) ent.mods = (ent.mods || []).filter(m => !(m.duration === 'once' && modAffectsRoll(m, kind)));
                const flatStr = flat ? ` ${flat >= 0 ? '+' : ''}${flat}` : '';
                logEvent(s, a.seatId, `rolled ${rolls.map(r => `d${r.die}=${r.value}`).join(', ')}${flatStr}${(rolls.length > 1 || flat) ? ` (total ${s.lastDice.total})` : ''}`);
                break;
            }
            case 'ADD_MOD': { addMod(s, a.seatId, a.mod); const e = combatantOf(s, a.seatId); if (e && a.mod) logEvent(s, a.seatId, `gained ${describeMod(a.mod)}`); break; }
            case 'CLEAR_MODS': {
                const ent = combatantOf(s, a.seatId); if (!ent) break;
                ent.mods = a.id ? (ent.mods || []).filter(m => m.id !== a.id) : [];
                break;
            }
            case 'ROLL_GRID': {
                // The monster may CHOOSE one axis and roll the other (axis 'x' = it
                // picked the column, 'y' = it picked the row); otherwise both random.
                const rndCol = () => 1 + Math.floor(Math.random() * Math.max(1, a.cols || 1));
                const rndRow = () => String.fromCharCode(65 + Math.floor(Math.random() * Math.max(1, a.rows || 1)));
                let col, row;
                if (a.axis === 'x' && a.value) { col = a.value; row = rndRow(); }
                else if (a.axis === 'y' && a.value) { row = String.fromCharCode(64 + a.value); col = rndCol(); }
                else { col = rndCol(); row = rndRow(); }
                s.lastGrid = { col, row, axis: a.axis || 'random', ts: Date.now() };
                const how = a.axis === 'x' ? `chose col ${col}, rolled row` : a.axis === 'y' ? `chose row ${row}, rolled col` : 'both random';
                logEvent(s, a.seatId || 'seat-monster', `grid roll (${how}) → ${col}-${row}`);
                break;
            }
            case 'COMBAT': {
                const atk = combatantOf(s, a.attackerId), def = combatantOf(s, a.defenderId);
                if (!atk || !def || atk.id === def.id) break;
                const score = scoreOf(s), monChar = monsterCharOf(s, data);
                const ac = combatStats(atk, data, score, monChar, a.via), dc = combatStats(def, data, score, monChar);
                const rawCombatOf = e => { const ch = charSheetOf(e, data); return (ch && ch.combat) || {}; };
                const ra = rawCombatOf(atk), rd = rawCombatOf(def);
                const dist = (atk.x != null && def.x != null) ? Math.max(Math.abs(atk.x - def.x), Math.abs(atk.y - def.y)) : 1;
                // The one contextual bonus: rangedAttack gives +dice when striking from
                // beyond reach 1 (the Ranger's reward for keeping his distance).
                let ctxAtkDice = 0; const ctxAtk = [], ctxDef = [];
                if (ra.rangedAttack && dist > (ra.rangedFrom || 1)) { ctxAtkDice += ra.rangedAttack; ctxAtk.push(`+${ra.rangedAttack}⚔ from range`); }

                const roll = () => 1 + Math.floor(Math.random() * 6);
                const skulls = f => f.filter(v => v <= 3).length;   // faces 1-3 = ☠
                const shields = f => f.filter(v => v >= 4 && v <= 5).length; // 4-5 = 🛡
                // effects already on each fighter (extra pool dice + flat skulls/shields, e.g. from cards)
                const atkMods = (atk.mods || []).filter(modAffectsAttack);
                const defMods = (def.mods || []).filter(modAffectsDefense);
                const sum = (list, k) => list.reduce((n, m) => n + (m[k] || 0), 0);
                // Uniform combat: each side rolls its Attack / Defense dice (+ any
                // modifier dice), adds flat base skulls/shields, then tallies skulls
                // against the opponent's shields. Pool length floored at 0.
                const atkFaces = Array.from({ length: Math.max(0, ac.attack + ctxAtkDice + (a.bonusAttack || 0) + sum(atkMods, 'attackDice')) }, roll);
                const defFaces = Array.from({ length: Math.max(0, dc.defense + (a.bonusDefense || 0) + sum(defMods, 'defenseDice')) }, roll);
                const atkSkulls = skulls(atkFaces) + ac.baseAttack + sum(atkMods, 'skull');
                const atkShields = shields(atkFaces) + ac.baseShield;
                const defSkulls = skulls(defFaces) + dc.baseAttack;
                const defShields = shields(defFaces) + dc.baseShield + sum(defMods, 'shield');
                const woundsToDef = Math.max(0, atkSkulls - defShields);
                // REACH GATES THE COUNTER-BLOW: the defender only hits back if the
                // attacker is within the defender's reach. A melee fighter struck from
                // range can't retaliate; a long-reach attacker (Ranger, a wide-reach
                // monster) strikes safely.
                const canCounter = dist <= dc.reach;
                let woundsToAtk = canCounter ? Math.max(0, defSkulls - atkShields) : 0;
                if (!canCounter && defSkulls > atkShields) ctxDef.push('out of reach — no counter');

                // Apply wounds to a fighter: the monster can't be killed (heroes shove
                // it back instead); heroes/minions lose HP → gravestone/removal.
                const applyWounds = (target, from, wounds) => {
                    if (wounds <= 0) return 0;
                    // the monster — and Maraurn'Zol's clone — can't be killed; heroes shove them back
                    if (target.kind === 'monster' || target.clone) return pushAway(target, from, wounds, a.cols, a.rows);
                    target.hp = Math.max(0, (target.hp || 0) - wounds);
                    if (target.hp <= 0 && !target.dead) die(s, target, data);
                    return 0;
                };
                const repelDef = applyWounds(def, atk, woundsToDef);
                const repelAtk = applyWounds(atk, def, woundsToAtk);

                // FLEE: only a hero defender may flee, and only if it rolled at least
                // `threshold` shields. Threshold = base 2 + the hero's own fleeMod
                // (Scout slips easily, heavy heroes struggle) + the attacker's fleeMod
                // (some monsters are harder to escape). Tracked & shown every combat.
                let flee = null;
                if (def.kind === 'hero') {
                    // clamp so the threshold is always reachable (≤ the most shields the
                    // hero could roll) — otherwise low-defense heroes could never flee.
                    const maxShields = Math.max(1, dc.defense + dc.baseShield);
                    const threshold = Math.max(1, Math.min(maxShields, FLEE_BASE + (rd.fleeMod || 0) + (ra.fleeMod || 0)));
                    flee = { threshold, shields: defShields, can: defShields >= threshold };
                }

                // consume one-shot combat modifiers that just fired
                atk.mods = (atk.mods || []).filter(m => !(m.duration === 'once' && modAffectsAttack(m)));
                def.mods = (def.mods || []).filter(m => !(m.duration === 'once' && modAffectsDefense(m)));

                s.lastCombat = {
                    attackerId: atk.id, defenderId: def.id, atkFaces, defFaces,
                    atkKey: colorKeyOf(atk), defKey: colorKeyOf(def),
                    atkSkulls, atkShields, defSkulls, defShields, flee,
                    modsAtk: atkMods.map(describeMod).concat(ctxAtk), modsDef: defMods.map(describeMod).concat(ctxDef),
                    woundsToDef, woundsToAtk, repelDef, repelAtk, ts: Date.now(),
                };
                const dmgOut = (target, wounds, repel) => target.kind === 'monster'
                    ? (repel ? `pushed back ${repel}` : 'held ground')
                    : (wounds ? `${wounds} wound${wounds !== 1 ? 's' : ''}` : 'no damage');
                logEvent(s, atk.id, `attacks ${def.label} — ${atkSkulls}☠/${atkShields}🛡 vs ${defSkulls}☠/${defShields}🛡 → ` +
                    `${def.label} ${dmgOut(def, woundsToDef, repelDef)}, ${atk.label} ${dmgOut(atk, woundsToAtk, repelAtk)}` +
                    (flee ? ` · ${flee.can ? 'may FLEE' : 'cannot flee'} (${flee.shields}🛡/need ${flee.threshold})` : ''));
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

    // ---- one distance metric for the whole game ---------------------------
    // Distance is counted in orthogonal STEPS (up/down/left/right). Diagonals cost
    // two steps for everyone EXCEPT the GREEN hero, who may cut corners (one step).
    // Sight, reach and movement all read from this, so "spaces away" means one thing.
    function canDiagonal(ent) { return !!(ent && ent.kind === 'hero' && ent.color === 'GREEN'); }
    function stepDistance(ax, ay, bx, by, diagonal) {
        const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
        return diagonal ? Math.max(dx, dy) : dx + dy;
    }

    g.GameLogic = { empty, newGame, apply, redactFor, seatOf, charOf, cardOf, shuffle,
        effectiveReach, effectiveSight, effectiveBlast, charSheetOf, oblexMinionBonus, scoreOf, monsterCharOf, ladderValue,
        canDiagonal, stepDistance, combatStats, FORM_COMBAT, FLEE_BASE };
})(typeof globalThis !== 'undefined' ? globalThis : this);
