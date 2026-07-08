/*
 * PlayController — the in-game HUD overlaid on the board in Play mode:
 * deck/discard piles, a private hand tray, hero/monster popover cards,
 * a virtual dice roller (each character's own dice) and the monster grid roller.
 * All state lives in GameState (js/gamestate.js) and syncs across tabs.
 */
const PH_BACKS = { White: 'css/CardBACK2.png', Black: 'css/CardBACK.png' };
const PH_EMBLEM = { hero: 'css/good.png', monster: 'css/bad.png' };
const PH_COLOR = { RED: '#ff3333', YELLOW: '#ffd21f', GREEN: '#33cc44', BLUE: '#3366ff', PURPLE: '#9933ff', MONSTER: '#5c1020' };
const PH_DICE = [4, 6, 8, 10, 12, 20];
const ICON_SKULL = '<svg class="ci ci-skull" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8v3.2c0 1 .5 1.9 1.4 2.4l1.1.6V19a1 1 0 0 0 1 1h1v-2h1v2h2v-2h1v2h1a1 1 0 0 0 1-1v-2.8l1.1-.6c.9-.5 1.4-1.4 1.4-2.4V10a8 8 0 0 0-8-8Zm-3 9a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm6 0a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z"/></svg>';
const ICON_SHIELD = '<svg class="ci ci-shield" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 5v6c0 4.5 3.2 8.6 8 11 4.8-2.4 8-6.5 8-11V5l-8-3Z"/></svg>';

class PlayController {
    constructor(app) {
        this.app = app;
        this.gs = new GameState();
        this.openSeatId = null;      // character popover currently open (local)
        this.handOpen = true;
        this.built = false;
        this.dragPiece = null;
        this.gs.subscribe(() => { if (this.app.appMode === 'play') { this.render(); this.app.renderer.draw(); } });
    }

    // ---- board piece dragging (called from AppController canvas events) ---
    pieceAt(x, y) {
        if (!this.gs.state.started) return null;
        const all = this.gs.state.seats.concat(this.gs.state.minions || []);
        for (let i = all.length - 1; i >= 0; i--) if (all[i].x === x && all[i].y === y) return all[i].id;
        return null;
    }
    onPieceDown(x, y) {
        const id = this.pieceAt(x, y); if (!id) return false;
        const ent = this.gs.combatant(id); if (!ent) return false;
        this.dragPiece = { seatId: id, x, y, sx: ent.x, sy: ent.y };
        return true;
    }
    onPieceMove(x, y) {
        if (!this.dragPiece) return false;
        const b = this.app.board;
        this.dragPiece.x = Math.max(0, Math.min(b.cols - 1, x));
        this.dragPiece.y = Math.max(0, Math.min(b.rows - 1, y));
        this.app.renderer.draw();
        return true;
    }
    onPieceUp() {
        if (!this.dragPiece) return false;
        const d = this.dragPiece; this.dragPiece = null;
        if (d.x === d.sx && d.y === d.sy) this.openPopover(d.seatId);   // click = open sheet
        else this.gs.movePiece(d.seatId, d.x, d.y);                     // drag = move
        this.app.renderer.draw();
        return true;
    }

    activate() {
        if (!this.built) { this.build(); this.built = true; }
        document.getElementById('play-hud').style.display = 'block';
        const side = document.getElementById('play-sidebar'); if (side) side.style.display = 'block';
        this.maybeAutoConnect();
        this.render();
    }

    // Auto-join from a shared ?room=CODE link (host from ?host= or config).
    maybeAutoConnect() {
        if (this._autoTried) return; this._autoTried = true;
        const params = new URLSearchParams(location.search);
        const room = params.get('room');
        const host = params.get('host') || window.GAME_SERVER;
        if (room && host && this.gs.status === 'offline') this.gs.connect(host, room);
    }
    deactivate() {
        const h = document.getElementById('play-hud'); if (h) h.style.display = 'none';
        const side = document.getElementById('play-sidebar'); if (side) side.style.display = 'none';
    }

    build() {
        const hud = document.getElementById('play-hud');
        // Board overlay: only the top bar, the log, the played-card banner, the
        // bottom hand tray and the popover live here now. The dice roller, roll
        // numbers, combat and decks all moved into the left sidebar trays.
        hud.innerHTML =
            '<div id="ph-roster"></div>' +
            '<div id="ph-log"></div>' +
            '<div id="ph-played"></div>' +
            '<div id="ph-hand" class="ph-hand"></div>' +
            '<div id="ph-pop" class="ph-pop" style="display:none;"></div>';
        hud.addEventListener('click', (e) => { if (e.target.id === 'ph-pop') this.closePopover(); });
    }

    // Build the persistent left-sidebar tray scaffold ONCE. It is never wiped by
    // render() (only its sub-sections are), so the 3D dice tray's WebGL canvas —
    // created lazily into #ph-tray — survives re-renders.
    ensureSidebar() {
        const wrap = document.getElementById('play-sidebar');
        if (!wrap || this.sidebarBuilt) return;
        const sec = (key, title, extra, body) =>
            `<section class="ph-tray-sec" data-sec="${key}">` +
                `<header class="ph-tray-head"><span>${title}</span><span class="ph-tray-head-r">${extra || ''}<button class="ph-tray-toggle" data-sec="${key}" title="Collapse">▾</button></span></header>` +
                `<div class="ph-tray-body" id="ph-sec-${key}-wrap">${body}</div>` +
            `</section>`;
        wrap.innerHTML =
            sec('dice', '🎲 Dice', '', '<div id="ph-sec-dice"></div>') +
            sec('rolls', '🎯 Rolls',
                '<button class="ph-tray-pop" id="ph-tray-pop" title="Pop the dice tray out over the board">⤢</button>',
                '<div id="ph-rolls-inner">' +
                    '<div id="ph-tray-host">' +
                        '<div id="ph-tray-move" class="ph-tray-move" title="Drag to move">⠿ dice tray</div>' +
                        '<button id="ph-tray-dock" class="ph-tray-dock" title="Dock back into the menu">⤢ dock</button>' +
                        '<div id="ph-tray" class="ph-tray"></div>' +
                        '<div id="ph-tray-resize" class="ph-tray-resize" title="Drag to resize">⤡</div>' +
                    '</div>' +
                    '<div id="ph-roll-nums" class="ph-roll-nums"></div>' +
                '</div>') +
            sec('combat', '⚔ Combat', '', '<div id="ph-sec-combat"></div>') +
            sec('decks', '🂠 Decks', '', '<div id="ph-decks"></div>');
        this.sidebarBuilt = true;

        // collapse/expand each tray section
        const collapsed = JSON.parse(localStorage.getItem('ph_sec_collapsed') || '{}');
        wrap.querySelectorAll('.ph-tray-sec').forEach(s => { if (collapsed[s.dataset.sec]) s.classList.add('collapsed'); });
        wrap.querySelectorAll('.ph-tray-toggle').forEach(btn => btn.onclick = () => {
            const s = btn.closest('.ph-tray-sec'); s.classList.toggle('collapsed');
            collapsed[s.dataset.sec] = s.classList.contains('collapsed');
            localStorage.setItem('ph_sec_collapsed', JSON.stringify(collapsed));
            if (s.dataset.sec === 'rolls' && window.DiceTray) window.DiceTray.resize();
        });
        const pop = document.getElementById('ph-tray-pop');
        if (pop) pop.onclick = () => this.toggleTrayPopout(true);
        const dock = document.getElementById('ph-tray-dock');
        if (dock) dock.onclick = () => this.toggleTrayPopout(false);
        this.initTrayResize();
        this.initTrayDrag();
    }

    // Float the dice tray + roll numbers over the board (or dock back into the sidebar).
    // force===true → pop out, false → dock, undefined → toggle.
    toggleTrayPopout(force) {
        const inner = document.getElementById('ph-rolls-inner');
        if (!inner) return;
        const floating = force === undefined ? !inner.classList.contains('popped') : force;
        inner.classList.toggle('popped', floating);
        if (floating) {
            document.body.appendChild(inner);
            // land bottom-right on screen unless a previous position is remembered
            const pos = this._trayPos;
            inner.style.left = (pos ? pos.x : Math.max(8, window.innerWidth - 340)) + 'px';
            inner.style.top = (pos ? pos.y : Math.max(8, window.innerHeight - 300)) + 'px';
            inner.style.right = 'auto'; inner.style.bottom = 'auto';
        } else {
            inner.style.left = inner.style.top = inner.style.right = inner.style.bottom = '';
            const wrap = document.getElementById('ph-sec-rolls-wrap');
            if (wrap) wrap.insertBefore(inner, wrap.firstChild);
        }
        if (window.DiceTray) setTimeout(() => window.DiceTray.resize(), 30);
    }

    // Drag the popped-out tray around the screen by its move handle.
    initTrayDrag() {
        const inner = document.getElementById('ph-rolls-inner');
        const handle = document.getElementById('ph-tray-move');
        if (!inner || !handle) return;
        let start = null;
        const pt = e => (e.touches && e.touches[0]) || e;
        const move = e => {
            if (!start) return; const p = pt(e);
            const x = Math.max(0, Math.min(window.innerWidth - 60, start.x + (p.clientX - start.px)));
            const y = Math.max(0, Math.min(window.innerHeight - 40, start.y + (p.clientY - start.py)));
            inner.style.left = x + 'px'; inner.style.top = y + 'px'; inner.style.right = 'auto'; inner.style.bottom = 'auto';
            this._trayPos = { x, y };
            if (e.cancelable) e.preventDefault();
        };
        const up = () => {
            start = null;
            document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
        };
        const down = e => {
            if (!inner.classList.contains('popped')) return;
            e.preventDefault(); e.stopPropagation(); const p = pt(e);
            const r = inner.getBoundingClientRect();
            start = { px: p.clientX, py: p.clientY, x: r.left, y: r.top };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
            document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
        };
        handle.addEventListener('mousedown', down);
        handle.addEventListener('touchstart', down, { passive: false });
    }

    // Drag the corner handle to set the dice tray height (it spans the sidebar width).
    initTrayResize() {
        const host = document.getElementById('ph-tray-host');
        const handle = document.getElementById('ph-tray-resize');
        if (!host || !handle) return;
        try { const h = Number(localStorage.getItem('ph_tray_h')); if (h) host.style.height = h + 'px'; } catch (e) {}
        let start = null;
        const pt = e => (e.touches && e.touches[0]) || e;
        const move = e => {
            if (!start) return; const p = pt(e);
            const h = Math.max(120, Math.min(520, start.h + (p.clientY - start.y)));
            host.style.height = h + 'px';
            if (e.cancelable) e.preventDefault();
        };
        const up = () => {
            if (!start) return; start = null;
            localStorage.setItem('ph_tray_h', String(host.offsetHeight));
            if (window.DiceTray) window.DiceTray.resize();
            document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
        };
        const down = e => {
            e.preventDefault(); e.stopPropagation(); const p = pt(e);
            start = { y: p.clientY, h: host.offsetHeight };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
            document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
        };
        handle.addEventListener('mousedown', down);
        handle.addEventListener('touchstart', down, { passive: false });
    }

    render() {
        this.ensureSidebar();
        if (!this.gs.state.started) { this.renderWelcome(); return; }
        this.renderRoster();
        this.renderDiceSection();
        this.renderCombatSection();
        this.renderDecks();
        this.renderRollNums();
        this.renderHand();
        this.renderLog();
        this.renderPlayed();
        this.maybeAnimateDice();
        this.maybeAnimateCombat();
        this.maybeHighlightGrid();
        if (this.openSeatId) this.renderPopover();
    }

    // When the monster rolls a grid target, light up that column + row on the
    // board (same highlight as tapping a gutter), once per new synced roll.
    maybeHighlightGrid() {
        const lg = this.gs.state.lastGrid;
        if (!lg || lg.ts === this._gridTs) return;
        this._gridTs = lg.ts;
        this.app.highlightedCol = (lg.col | 0) - 1;
        this.app.highlightedRow = String(lg.row).charCodeAt(0) - 65;
        this.app.renderer.draw();
    }

    _clearSidebarDynamic() {
        ['ph-sec-dice', 'ph-sec-combat', 'ph-decks', 'ph-roll-nums'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    }

    // Fire the 3D dice tray once per new (synced) roll, forced to the result.
    maybeAnimateDice() {
        const ld = this.gs.state.lastDice;
        if (!ld || ld.ts === this._diceTs) return;
        this._diceTs = ld.ts;
        if (!window.DiceTray) return;
        const seat = this.gs.seat(ld.seatId);
        // colored by the hero (seat color); monster uses its own red
        const colorKey = seat ? (seat.kind === 'monster' ? 'monster' : seat.color) : 'action';
        // each die keeps its own color; bonus dice (ba/bm) render marbled/special
        const specs = ld.rolls.filter(r => r.die).map(r => ({
            type: 'd' + r.die, value: r.value, colorKey, marble: r.key === 'ba' || r.key === 'bm',
        }));
        if (!specs.length) return;
        window.DiceTray.roll(specs, colorKey, null);
    }

    // ---- sidebar: Dice tray -----------------------------------------------
    renderDiceSection() {
        const wrap = document.getElementById('ph-sec-dice'); if (!wrap) return;
        const seat = this.gs.seat(this.gs.mySeatId);
        if (!seat) { wrap.innerHTML = '<p class="ph-side-hint">Pick your seat (top bar) to roll here.</p>'; return; }
        const ch = this.gs.character(seat);
        let html = `<div class="ph-side-seat" style="--c:${PH_COLOR[seat.color] || '#888'}">${esc(seat.label)}</div>`;
        html += this.diceBar(seat, ch, false);
        if (seat.kind === 'monster') html += `<button id="ph-side-grid" class="ph-btn ph-btn-go" style="width:100%;margin-top:6px;">Roll grid ▸ #/A</button>`;
        html += this.modsBar(seat);
        wrap.innerHTML = html;
        this.wireDice(wrap, seat);
        this.wireMods(wrap, seat);
        const g = document.getElementById('ph-side-grid');
        if (g) g.onclick = () => this.gs.rollGrid(seat.id, this.app.board.cols, this.app.board.rows);
    }

    // Active roll/combat modifiers queued on a fighter (from played cards, etc.).
    // Each shows what it does, when it applies, and can be cancelled.
    modsBar(ent) {
        const mods = (ent && ent.mods) || [];
        if (!mods.length) return '';
        const dur = { once: 'next roll', turn: 'this turn', persist: 'permanent' };
        const chips = mods.map(m => {
            const label = describeModShort(m);
            return `<span class="ph-mod" title="${esc(m.source || '')} · ${dur[m.duration] || ''}">` +
                `<span class="ph-mod-scope">${esc(m.scope)}</span>${label}` +
                `<button class="ph-mod-x" data-mod="${m.id}" title="Cancel">✕</button></span>`;
        }).join('');
        return `<div class="ph-mods"><div class="ph-mods-head">Active effects</div><div class="ph-mods-row">${chips}</div></div>`;
    }
    wireMods(container, ent) {
        container.querySelectorAll('.ph-mod-x').forEach(b =>
            b.onclick = () => this.gs.clearMod(ent.id, b.dataset.mod));
    }

    // ---- sidebar: Combat --------------------------------------------------
    renderCombatSection() {
        const wrap = document.getElementById('ph-sec-combat'); if (!wrap) return;
        const seat = this.gs.seat(this.gs.mySeatId);
        if (!seat) { wrap.innerHTML = '<p class="ph-side-hint">Pick your seat to attack.</p>'; return; }
        const ch = this.gs.character(seat);
        const c = (ch && ch.combat) || {};
        const base = (c.baseAttack ? ` · +${c.baseAttack}☠` : '') + (c.baseShield ? ` · +${c.baseShield}🛡` : '');
        wrap.innerHTML =
            `<div class="ph-side-seat" style="--c:${PH_COLOR[seat.color] || '#888'}">⚔ ${c.attack || 0} / 🛡 ${c.defense || 0}${symbolize(base)}</div>` +
            this.attackRow(seat) +
            `<div class="ph-muted" style="font-size:10px;margin-top:5px;">Both sides roll: your skulls wound the target, their skulls wound you — shields block.</div>`;
        const go = wrap.querySelector('.ph-atk-go');
        if (go) go.onclick = () => { const t = wrap.querySelector('.ph-atk-target'); if (t && t.value) this.gs.attack(seat.id, t.value, this.app.board.cols, this.app.board.rows); };
    }

    // ---- dice bar (shared by sidebar + character sheet) -------------------
    // Action (a1/a2) left · Bonus (BA left, BM right) middle · Movement (m1/m2) right.
    // Bonus dice are locked until enough objectives: BM at 4, BA at 7.
    diceBar(seat, ch, vertical) {
        const dice = this.characterDice(seat, ch);
        const score = (this.gs.state.score && this.gs.state.score.collected) || 0;
        const find = k => dice.find(d => d.key === k);
        const dbtn = (d, locked, unlockAt) => {
            if (!d) return '<span class="ph-muted ph-die-none">—</span>';
            return `<button class="ph-die-btn${locked ? ' locked' : ''}" ${locked ? 'disabled' : ''} data-die="${d.die}" data-key="${d.key}"` +
                ` title="${locked ? 'Unlocks at ' + unlockAt + ' objectives' : 'Roll ' + d.key + ' (d' + d.die + ')'}">` +
                this.dieFace(d.die) + `<span class="ph-die-k">${icon(d.label)}${locked ? ' 🔒' : ''}</span></button>`;
        };
        const setA = dice.filter(d => d.grp === 'a').map(d => dbtn(d)).join('') || '<span class="ph-muted ph-die-none">—</span>';
        const setM = dice.filter(d => d.grp === 'm').map(d => dbtn(d)).join('') || '<span class="ph-muted ph-die-none">—</span>';
        const ba = find('ba'), bm = find('bm');
        const setB = (ba || bm) ? (dbtn(ba, score < 7, 7) + dbtn(bm, score < 4, 4)) : '<span class="ph-muted ph-die-none">—</span>';
        const head = (grp, label) => `<button class="ph-dhead" data-grp="${grp}">${icon(label)}</button>`;
        return `<div class="ph-dicebar${vertical ? ' vert' : ''}">` +
            `<div class="ph-dcol">${head('a', 'Action ☼')}<div class="ph-dset">${setA}</div></div>` +
            `<div class="ph-dcol ph-dcol-bonus"><div class="ph-dhead-s">Bonus</div><div class="ph-dset">${setB}</div></div>` +
            `<div class="ph-dcol">${head('m', 'Move ֍')}<div class="ph-dset">${setM}</div></div>` +
        `</div>`;
    }
    // action/move classification drives which modifiers apply to a roll
    kindOfKey(key) { return /^(m|bm|move)/.test(key || '') ? 'move' : 'action'; }
    wireDice(container, seat) {
        const dice = this.characterDice(seat, this.gs.character(seat));
        const score = (this.gs.state.score && this.gs.state.score.collected) || 0;
        container.querySelectorAll('.ph-die-btn:not(.locked)').forEach(b =>
            b.onclick = () => this.gs.rollDice(seat.id, [{ key: b.dataset.key, die: Number(b.dataset.die) }], this.kindOfKey(b.dataset.key)));
        container.querySelectorAll('.ph-dhead[data-grp]').forEach(b =>
            b.onclick = () => {
                const grp = b.dataset.grp;
                let list = dice.filter(d => d.grp === grp);
                // once unlocked via objectives, the bonus die rolls together with its
                // group's action/move button (BM at 4◆, BA at 7◆).
                if (grp === 'a' && score >= 7) list = list.concat(dice.filter(d => d.key === 'ba'));
                if (grp === 'm' && score >= 4) list = list.concat(dice.filter(d => d.key === 'bm'));
                if (list.length) this.gs.rollDice(seat.id, list.map(d => ({ key: d.key, die: d.die })), grp === 'm' ? 'move' : 'action');
            });
    }

    // ---- shared "last played card" (each player dismisses their own view) --
    renderPlayed() {
        const wrap = document.getElementById('ph-played');
        const lp = this.gs.state.lastPlayed;
        if (!lp || this.dismissedPlayedTs === lp.ts) { wrap.innerHTML = ''; return; }
        const c = this.gs.card(lp.cid); if (!c) { wrap.innerHTML = ''; return; }
        const seat = this.gs.seat(lp.seatId);
        const col = seat ? (PH_COLOR[seat.color] || '#888') : '#888';
        wrap.innerHTML =
            `<div class="ph-played-card" style="--c:${col}">` +
                `<div class="ph-played-head"><span style="color:${col}">${esc(seat ? seat.label : '')} played</span>` +
                    `<button class="ph-played-x" title="Dismiss for me">✕</button></div>` +
                this.cardFace(c) +
            `</div>`;
        wrap.querySelector('.ph-played-x').onclick = () => { this.dismissedPlayedTs = lp.ts; this.renderPlayed(); };
    }

    renderWelcome() {
        const online = this.gs.status === 'online';
        document.getElementById('ph-roster').innerHTML =
            `<div class="ph-bar"><div class="ph-seats"></div><div class="ph-bar-ctl">${this.onlineControl()}</div></div>` +
            `<div class="ph-welcome"><b>Game table</b>` +
            `<p>${online ? 'Connected — anyone in this room can deal.' : 'Play solo/hotseat here, or go online for cross-device play.'}<br>Deal the decks and seat the 5 heroes + monster.</p>` +
            `<button id="ph-new" class="ph-btn ph-btn-go">Deal &amp; start</button></div>`;
        ['ph-hand', 'ph-played', 'ph-log'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
        this._clearSidebarDynamic();   // keep the sidebar scaffold (and dice tray) intact
        document.getElementById('ph-new').onclick = () => this.gs.newGame();
        this.wireOnline();
    }

    wireOnline() {
        const onl = document.getElementById('ph-online');
        if (onl) onl.onclick = () => (this.gs.status === 'offline' || this.gs.status === 'error') ? this.promptConnect() : this.gs.disconnect();
        const inv = document.getElementById('ph-invite');
        if (inv) inv.onclick = () => this.copyInvite();
    }

    // ---- roster / seats ---------------------------------------------------
    renderRoster() {
        const s = this.gs.state;
        const heroesTurn = s.phase !== 'monster';
        const chips = s.seats.map(seat => {
            const active = ((seat.kind === 'monster') ? !heroesTurn : heroesTurn) ? ' active' : '';
            const mine = seat.id === this.gs.mySeatId ? ' mine' : '';
            const col = PH_COLOR[seat.color] || '#888';
            return `<button class="ph-chip${active}${mine}" data-seat="${seat.id}" style="--c:${col}">` +
                `<span class="ph-chip-dot"></span>` +
                `<span class="ph-chip-name">${esc(seat.label)}</span>` +
                `<span class="ph-chip-count">${seat.hand.length}🂠</span></button>`;
        }).join('');
        const sc = s.score || { collected: 0, goal: 0 };
        const scoreChip =
            `<div class="ph-score" title="Objectives collected">` +
                `<button class="ph-score-btn" id="ph-score-dn">−</button>` +
                `<span class="ph-score-val">${GAME_ICONS.obj} <b>${sc.collected}</b>${sc.goal ? ' / ' + sc.goal : ''}</span>` +
                `<button class="ph-score-btn" id="ph-score-up">+</button>` +
            `</div>`;
        // Objective score + turn button stay inline; the seat picker, online
        // control and Reset live in a compact ⋯ menu so the bar fits on phones.
        document.getElementById('ph-roster').innerHTML =
            `<div class="ph-bar">` +
                `<div class="ph-seats">${chips}</div>` +
                `<div class="ph-bar-ctl">` +
                    scoreChip +
                    `<button id="ph-next" class="ph-btn ${heroesTurn ? 'ph-turn-hero' : 'ph-turn-mon'}">${heroesTurn ? "Heroes'" : "Monster's"} turn ▸ end</button>` +
                    `<div class="ph-more-wrap">` +
                        `<button id="ph-more" class="ph-btn" title="Table options">⋯</button>` +
                        `<div id="ph-more-menu" class="ph-more-menu" style="display:none">` +
                            `<label class="ph-me">You: <select id="ph-myseat">` +
                                `<option value="">— pick seat —</option>` +
                                s.seats.map(seat => `<option value="${seat.id}"${seat.id === this.gs.mySeatId ? ' selected' : ''}>${esc(seat.label)}</option>`).join('') +
                            `</select></label>` +
                            this.onlineControl() +
                            `<button id="ph-reset" class="ph-btn ph-btn-warn">Reset table</button>` +
                        `</div>` +
                    `</div>` +
                `</div>` +
            `</div>`;
        document.querySelectorAll('#ph-roster .ph-chip').forEach(b =>
            b.onclick = () => this.openPopover(b.dataset.seat));
        document.getElementById('ph-myseat').onchange = (e) => this.gs.setMySeat(e.target.value || null);
        document.getElementById('ph-next').onclick = () => this.gs.togglePhase();
        document.getElementById('ph-score-up').onclick = () => this.gs.score(1, this.gs.mySeatId);
        document.getElementById('ph-score-dn').onclick = () => this.gs.score(-1, this.gs.mySeatId);
        document.getElementById('ph-reset').onclick = () => { if (confirm('Reset the whole table?')) this.gs.resetGame(); };
        const more = document.getElementById('ph-more'), menu = document.getElementById('ph-more-menu');
        if (more && menu) {
            more.onclick = (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'flex' : 'none'; };
            menu.onclick = (e) => e.stopPropagation();   // interacting inside shouldn't close it
            if (!this._moreDocHooked) { this._moreDocHooked = true; document.addEventListener('click', () => { const m = document.getElementById('ph-more-menu'); if (m) m.style.display = 'none'; }); }
        }
        this.wireOnline();
    }

    onlineControl() {
        const st = this.gs.status;
        if (st === 'online') {
            return `<button id="ph-invite" class="ph-btn" title="Copy invite link">🔗 Invite</button>` +
                `<button id="ph-online" class="ph-btn ph-on-live" title="Disconnect">🌐 ${esc(this.gs._room || 'online')} ✕</button>`;
        }
        const map = { offline: ['🌐 Go online', ''], connecting: ['⏳ Connecting…', 'ph-on-wait'], error: ['⚠ Retry connect', 'ph-btn-warn'] };
        const [label, cls] = map[st] || map.offline;
        return `<button id="ph-online" class="ph-btn ${cls}" title="Cross-device play">${label}</button>`;
    }
    promptConnect() {
        let host = window.GAME_SERVER;
        if (!host) {   // no server baked in — ask for one (local dev / self-host)
            host = prompt('Server host (e.g. 127.0.0.1:1999 for local dev):', this.gs._host || '127.0.0.1:1999');
            if (!host) return;
        }
        const room = prompt('Room code — everyone at the table enters the same code:', this.gs._room || window.GAME_DEFAULT_ROOM || 'table-1');
        if (!room) return;
        this.gs.connect(host, room);
    }
    copyInvite() {
        const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(this.gs._room || '')}`;
        const done = () => alert('Invite link copied — share it:\n\n' + url);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copy this invite link:', url));
        else prompt('Copy this invite link:', url);
    }

    // ---- deck piles -------------------------------------------------------
    renderDecks() {
        const decks = this.gs.state.decks; if (!decks) return;
        const mySeat = this.gs.seat(this.gs.mySeatId);
        const pile = (name) => {
            const d = decks[name];
            const canDraw = mySeat && mySeat.deck === name;
            const topDiscard = d.discard.length ? this.gs.card(d.discard[d.discard.length - 1].cid) : null;
            return `<div class="ph-deck">` +
                `<div class="ph-pile ph-draw${canDraw ? ' can' : ''}" data-deck="${name}" title="${canDraw ? 'Draw a card' : name + ' draw pile'}">` +
                    `<img src="${PH_BACKS[name]}" alt="">` +
                    `<span class="ph-pile-n">${d.draw.length}</span>` +
                `</div>` +
                `<div class="ph-pile ph-discard" data-discard="${name}" title="${name} discard (${d.discard.length})">` +
                    (topDiscard ? this.cardArt(topDiscard) : '<div class="ph-pile-empty">discard</div>') +
                    `<span class="ph-pile-n">${d.discard.length}</span>` +
                `</div>` +
                `<div class="ph-deck-lbl">${name === 'White' ? 'Hero' : 'Monster'}</div>` +
            `</div>`;
        };
        document.getElementById('ph-decks').innerHTML = `<div class="ph-decks-inner">${pile('White')}${pile('Black')}</div>`;
        document.querySelectorAll('#ph-decks .ph-draw.can').forEach(el =>
            el.onclick = () => this.gs.draw(this.gs.mySeatId, el.dataset.deck));
        document.querySelectorAll('#ph-decks .ph-discard').forEach(el =>
            el.onclick = () => this.showDiscard(el.dataset.discard));
    }

    // ---- hand (private, bottom slide-in tray) -----------------------------
    renderHand() {
        const seat = this.gs.seat(this.gs.mySeatId);
        const wrap = document.getElementById('ph-hand');
        if (this.handOpen === undefined) this.handOpen = true;
        if (!seat) {
            wrap.className = 'ph-hand';
            wrap.innerHTML = `<div class="ph-hand-empty" style="padding:10px 12px;">Pick your seat to see your hand.</div>`;
            return;
        }
        const cards = seat.hand.map(inst => {
            const c = this.gs.card(inst.cid); if (!c) return '';
            return `<div class="ph-card" data-iid="${inst.iid}">` +
                this.cardFace(c) +
                `<div class="ph-card-actions">` +
                    `<button class="ph-play-btn" data-play="${inst.iid}" title="Play — trigger its effect, then discard">▶ Play</button>` +
                    `<button class="ph-disc-btn" data-disc="${inst.iid}" title="Discard without effect">Discard</button>` +
                `</div>` +
            `</div>`;
        }).join('');
        wrap.className = 'ph-hand' + (this.handOpen ? ' open' : '');
        wrap.innerHTML =
            `<button class="ph-hand-handle" id="ph-hand-handle">` +
                `<span class="ph-hand-grip">${this.handOpen ? '▾' : '▴'}</span>` +
                `<b style="color:${PH_COLOR[seat.color]}">${esc(seat.label)}</b> · hand ${seat.hand.length}/10` +
            `</button>` +
            `<div class="ph-hand-body">` +
                `<div class="ph-cards">${cards || '<div class="ph-hand-empty">Empty — draw from your pile.</div>'}</div>` +
            `</div>`;
        document.getElementById('ph-hand-handle').onclick = () => {
            this.handOpen = !this.handOpen;
            wrap.className = 'ph-hand' + (this.handOpen ? ' open' : '');
            const grip = wrap.querySelector('.ph-hand-grip'); if (grip) grip.textContent = this.handOpen ? '▾' : '▴';
        };
        wrap.querySelectorAll('[data-play]').forEach(b =>
            b.onclick = (e) => { e.stopPropagation(); this.gs.playCard(this.gs.mySeatId, b.dataset.play); });
        wrap.querySelectorAll('[data-disc]').forEach(b =>
            b.onclick = (e) => { e.stopPropagation(); this.gs.discard(this.gs.mySeatId, b.dataset.disc); });
    }

    // Resolve a combat color key (from GameLogic) to a CSS hex.
    keyHex(key) { return PH_COLOR[key] || (key === 'monster' ? PH_COLOR.MONSTER : key) || '#888'; }

    // ---- shared roll readout (sidebar, color-coded per owner, numbers only) --
    renderRollNums() {
        const el = document.getElementById('ph-roll-nums'); if (!el) return;
        const { lastDice, lastGrid, lastCombat } = this.gs.state;
        let html = '';
        if (lastDice) {
            const seat = this.gs.seat(lastDice.seatId);
            const col = seat ? (PH_COLOR[seat.color] || '#888') : '#888';
            const chips = lastDice.rolls.map(r => {
                const bonus = r.key === 'ba' || r.key === 'bm';
                const fromMod = !!r.from;
                return `<span class="ph-num${bonus ? ' bonus' : ''}${fromMod ? ' mod' : ''}" style="--c:${col}" title="d${r.die}${r.from ? ' · ' + esc(r.from) : (r.key ? ' · ' + r.key : '')}">${r.value}${bonus ? '★' : ''}</span>`;
            }).join('');
            // flat modifier bonus (e.g. SpellBook +1 ×2 → +2), shown as its own chip
            const flat = lastDice.flat || 0;
            const flatChip = flat ? `<span class="ph-num mod" style="--c:${col}" title="${(lastDice.modsApplied || []).map(m => esc(m.source)).join(', ')}">${flat >= 0 ? '+' : ''}${flat}</span>` : '';
            const showTotal = (lastDice.rolls.length > 1 || flat);
            html += `<div class="ph-nums-row"><span class="ph-nums-who" style="color:${col}">${esc(seat ? seat.label : '')}</span>` +
                `<span class="ph-nums-vals">${chips}${flatChip}</span>` +
                (showTotal ? `<span class="ph-nums-tot">=${lastDice.total}</span>` : '') + `</div>`;
        }
        if (lastGrid) {
            const col = PH_COLOR.MONSTER;
            html += `<div class="ph-nums-row"><span class="ph-nums-who" style="color:${col}">grid</span>` +
                `<span class="ph-nums-vals"><span class="ph-num" style="--c:${col}">${lastGrid.col}</span>` +
                `<span class="ph-num" style="--c:${col}">${esc(lastGrid.row)}</span></span></div>`;
        }
        if (lastCombat) {
            const atk = this.gs.combatant(lastCombat.attackerId), def = this.gs.combatant(lastCombat.defenderId);
            const ac = this.keyHex(lastCombat.atkKey), dc = this.keyHex(lastCombat.defKey);
            const side = (label, colHex, skulls, shields, dmg) =>
                `<div class="ph-cb-side" style="--c:${colHex}"><span class="ph-cb-name">${esc(label)}</span>` +
                `<span class="ph-cb-nums"><span class="ph-cb-sk">${ICON_SKULL}${skulls}</span>` +
                `<span class="ph-cb-sh">${ICON_SHIELD}${shields}</span></span>` +
                `<span class="ph-cb-dmg">${dmg}</span></div>`;
            const dmgTxt = (target, wounds, repel) => !target ? '' : (target.kind === 'monster'
                ? (repel ? `→ push ${repel}` : 'held') : (wounds ? `→ −${wounds}❤` : 'no dmg'));
            html += `<div class="ph-nums-combat">` +
                side(atk ? atk.label : 'Attacker', ac, lastCombat.atkSkulls, lastCombat.atkShields, dmgTxt(def, lastCombat.woundsToDef, lastCombat.repelDef)) +
                `<span class="ph-cb-vs">vs</span>` +
                side(def ? def.label : 'Defender', dc, lastCombat.defSkulls, lastCombat.defShields, dmgTxt(atk, lastCombat.woundsToAtk, lastCombat.repelAtk)) +
                `</div>`;
        }
        el.innerHTML = html || '<div class="ph-side-hint">Rolls show here.</div>';
    }

    // Fire the 3D combat dice once per new resolved exchange (attacker vs defender colors).
    maybeAnimateCombat() {
        const lc = this.gs.state.lastCombat;
        if (!lc || lc.ts === this._combatTs) return;
        this._combatTs = lc.ts;
        if (!window.DiceTray || !window.DiceTray.rollCombat) return;
        if (!(lc.atkFaces || []).length && !(lc.defFaces || []).length) return;
        window.DiceTray.rollCombat(lc.atkFaces || [], lc.defFaces || [], lc.atkKey || 'monster', lc.defKey || 'monster');
    }

    // ---- event log --------------------------------------------------------
    renderLog() {
        const wrap = document.getElementById('ph-log');
        if (this.logCollapsed) {
            wrap.innerHTML = `<button id="ph-log-toggle" class="ph-log-tab">📜 Log</button>`;
            document.getElementById('ph-log-toggle').onclick = () => { this.logCollapsed = false; this.renderLog(); };
            return;
        }
        const entries = (this.gs.state.log || []).slice(-40);
        const rows = entries.map(e => {
            const seat = this.gs.seat(e.seatId);
            const col = seat ? (PH_COLOR[seat.color] || '#8a95a0') : '#8a95a0';
            const who = seat ? `<b style="color:${col}">${esc(seat.label)}</b> ` : '';
            return `<div class="ph-log-row">${who}${esc(e.text)}</div>`;
        }).join('') || '<div class="ph-log-row ph-muted">No events yet.</div>';
        wrap.innerHTML =
            `<div class="ph-log-head"><span>📜 Event log</span><button id="ph-log-toggle" class="ph-log-min">–</button></div>` +
            `<div class="ph-log-body" id="ph-log-body">${rows}</div>`;
        document.getElementById('ph-log-toggle').onclick = () => { this.logCollapsed = true; this.renderLog(); };
        const body = document.getElementById('ph-log-body'); if (body) body.scrollTop = body.scrollHeight;
    }

    // ---- character popover (art + shaded blocks + rollers) ----------------
    openPopover(seatId) { this.openSeatId = seatId; this.renderPopover(); }
    closePopover() { this.openSeatId = null; document.getElementById('ph-pop').style.display = 'none'; }

    renderPopover() {
        if (this.gs.minion(this.openSeatId)) return this.renderMinionSheet(this.gs.minion(this.openSeatId));
        const seat = this.gs.seat(this.openSeatId); if (!seat) return this.closePopover();
        const ch = this.gs.character(seat);
        const pop = document.getElementById('ph-pop');
        const col = PH_COLOR[seat.color] || '#888';
        const chooser = window.GAME_DATA ? this.characterChooser(seat) : '';
        const gridBtn = seat.kind === 'monster'
            ? `<button id="ph-roll-grid" class="ph-btn ph-btn-go" style="width:100%;margin-bottom:8px;">Roll grid ▸ #/A</button>` : '';

        pop.innerHTML =
            `<div class="ph-sheet" style="--c:${col}">` +
                `<button class="ph-cc-close" title="Close">✕</button>` +
                `<div class="ph-sheet-top">` +
                    `<div class="ph-sheet-head"><h3>${esc(ch ? ch.name : seat.label)}</h3>` +
                        `<span>${esc(ch ? (ch.color || ch.element || '') : '')}</span>${chooser}</div>` +
                    this.diceBar(seat, ch, false) +
                `</div>` +
                `<div class="ph-sheet-body">` +
                    `<div class="ph-sheet-art"${ch && ch.art ? ` style="background-image:url('${esc(ch.art)}')"` : ''}></div>` +
                    `<div class="ph-sheet-info">` +
                        `<div class="ph-sheet-scrim"></div>` +   // transparent spacer on mobile: art peeks through
                        `<div class="ph-sheet-panels">` +
                            this.attackTargetBtn(seat) +
                            this.losBtn() +
                            gridBtn +
                            this.pieceBlock(seat) +
                            this.combatBlock(seat) +
                            this.formsBlock(seat, ch) +
                            (ch && ch.abilities ? `<div class="ph-cc-block"><h4>Abilities</h4><p>${fmt(ch.abilities)}</p></div>` : '') +
                            (ch && ch.objectiveAbilities ? `<div class="ph-cc-block"><h4>Objective ${icon('◆/◇')}</h4><p>${fmt(ch.objectiveAbilities)}</p></div>` : '') +
                        `</div>` +
                    `</div>` +
                `</div>` +
            `</div>`;
        pop.style.display = 'flex';

        pop.querySelector('.ph-cc-close').onclick = () => this.closePopover();
        this.wireAttackTarget(pop, seat.id);
        this.wireLosBtn(pop, seat.id);
        this.wireDice(pop, seat);
        const gb = pop.querySelector('#ph-roll-grid');
        if (gb) gb.onclick = () => this.gs.rollGrid(seat.id, this.app.board.cols, this.app.board.rows);
        const sel = pop.querySelector('.ph-cc-choose');
        if (sel) sel.onchange = (e) => this.gs.setSeatCharacter(seat.id, e.target.value);

        // piece controls
        const on = (s, fn) => { const el = pop.querySelector(s); if (el) el.onclick = fn; };
        on('.ph-hp-dn', () => this.gs.adjustHp(seat.id, -1));
        on('.ph-hp-up', () => this.gs.adjustHp(seat.id, 1));
        on('.ph-hp-dmg', () => this.gs.adjustHp(seat.id, -(parseInt(pop.querySelector('.ph-hp-amt').value, 10) || 0)));
        on('.ph-kill', () => this.gs.kill(seat.id));
        on('.ph-rev-tick', () => this.gs.reviveTick(seat.id, 1));
        on('.ph-revive', () => this.gs.reviveTick(seat.id, 9999));
        // druid forms
        pop.querySelectorAll('.ph-form-btn').forEach(b => b.onclick = () => this.gs.setForm(seat.id, b.dataset.form || null, false));
        on('.ph-ally-go', () => {
            const who = pop.querySelector('.ph-ally-sel').value;
            const form = pop.querySelector('.ph-ally-form').value;
            if (who) this.gs.setForm(who, form, true);
        });
        on('.ph-atk-go', () => {
            const target = pop.querySelector('.ph-atk-target');
            if (target && target.value) this.gs.attack(seat.id, target.value, this.app.board.cols, this.app.board.rows);
        });
    }

    // When you (mySeat) tap an enemy piece, offer to attack it — you are the
    // attacker, the tapped piece is the target (no dropdown needed on the board).
    attackTargetBtn(target) {
        const me = this.gs.seat(this.gs.mySeatId);
        if (!me || !target || me.id === target.id) return '';
        if (me.dead || target.dead || me.x == null || target.x == null) return '';
        if (!this.enemiesOf(me).some(e => e.id === target.id)) return '';
        const col = PH_COLOR[me.color] || '#888';
        return `<button class="ph-btn ph-btn-warn ph-attack-target" style="width:100%;margin-bottom:8px;background:${col};border-color:${col}">` +
            `⚔ Attack with ${esc(me.label)}</button>`;
    }
    wireAttackTarget(pop, targetId) {
        const btn = pop.querySelector('.ph-attack-target');
        if (btn) btn.onclick = () => { this.gs.attack(this.gs.mySeatId, targetId, this.app.board.cols, this.app.board.rows); this.closePopover(); };
    }
    // Button (in a piece sheet) that shows this piece's range + line of sight on the board.
    losBtn() { return `<button class="ph-btn ph-los-btn" style="width:100%;margin-bottom:8px;">👁 Show range / line of sight</button>`; }
    wireLosBtn(pop, id) {
        const b = pop.querySelector('.ph-los-btn');
        if (b) b.onclick = () => { this.app.inspectPieceId = id; this.closePopover(); this.app.renderer.draw(); };
    }

    // enemies = the opposing side (heroes vs monster+minions), placed & alive
    enemiesOf(ent) {
        const heroSide = ent.kind === 'hero';
        const list = heroSide
            ? this.gs.state.seats.filter(o => o.kind === 'monster').concat(this.gs.state.minions || [])
            : this.gs.state.seats.filter(o => o.kind === 'hero');
        return list.filter(o => o.x != null && !o.dead);
    }
    attackRow(ent) {
        const enemies = this.enemiesOf(ent);
        const opts = enemies.map(o => `<option value="${o.id}">${esc(o.label)} · ${this.dist(ent, o)} away</option>`).join('')
            || '<option value="">no targets on board</option>';
        return `<div class="ph-atk-row"><select class="ph-atk-target">${opts}</select>` +
            `<button class="ph-btn ph-btn-warn ph-atk-go"${enemies.length ? '' : ' disabled'}>Attack ⚔</button></div>`;
    }
    // ⚔ attack: pick an enemy piece and resolve one exchange
    combatBlock(seat) {
        const ch = this.gs.character(seat);
        const c = (ch && ch.combat) || {};
        const reachNote = c.reach > 1 ? ` · reach ${c.reach}` : '';
        const base = (c.baseAttack ? ` · +${c.baseAttack}☠` : '') + (c.baseShield ? ` · +${c.baseShield}🛡` : '');
        return `<div class="ph-cc-block"><h4>Combat — ⚔ ${c.attack || 0} / 🛡 ${c.defense || 0}${symbolize(base)}${reachNote}</h4>` +
            this.attackRow(seat) +
            `<div class="ph-muted" style="font-size:10px;margin-top:4px;">Both sides roll — your skulls wound the target, their skulls wound you; shields block. Damage applies automatically.</div></div>`;
    }
    dist(a, b) { return (a.x == null || b.x == null) ? '?' : Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }

    // a −/value/+ stepper row for tweaking a single minion stat
    minionStat(label, value, stat) {
        return `<div class="ph-stat-row"><span class="ph-stat-lbl">${label}</span>` +
            `<button class="ph-btn ph-stat-dn" data-stat="${stat}">−</button>` +
            `<span class="ph-stat-val">${value}</span>` +
            `<button class="ph-btn ph-stat-up" data-stat="${stat}">+</button></div>`;
    }
    renderMinionSheet(m) {
        const pop = document.getElementById('ph-pop');
        pop.innerHTML =
            `<div class="ph-sheet" style="--c:#9b2d2d;max-width:360px">` +
                `<button class="ph-cc-close" title="Close">✕</button>` +
                `<div class="ph-sheet-top"><div class="ph-sheet-head"><h3>☠ ${esc(m.label)}</h3><span>minion</span></div></div>` +
                `<div class="ph-sheet-body" style="display:block"><div class="ph-sheet-info">` +
                    this.attackTargetBtn(m) +
                    this.losBtn() +
                    `<div class="ph-cc-block"><h4>Piece · ${m.x + 1}-${String.fromCharCode(65 + m.y)}</h4>` +
                        `<div class="ph-hp-row"><button class="ph-btn ph-hp-dn">−</button>` +
                        `<span class="ph-hp-val">❤ ${m.hp}/${m.maxHp}</span>` +
                        `<button class="ph-btn ph-hp-up">+</button>` +
                        `<button class="ph-btn ph-btn-warn ph-min-remove">Remove</button></div>` +
                        `<div class="ph-muted" style="font-size:10px;margin-top:4px;">Drag on the board to move. HP is rolled (d4) on spawn.</div></div>` +
                    `<div class="ph-cc-block"><h4>Enhance</h4>` +
                        this.minionStat('Max ❤', m.maxHp, 'maxHp') +
                        this.minionStat('⚔ Attack', m.attack, 'attack') +
                        this.minionStat('🛡 Defense', m.defense, 'defense') +
                        this.minionStat('Reach', m.reach || 1, 'reach') +
                    `</div>` +
                    `<div class="ph-cc-block"><h4>Combat — ⚔ ${m.attack} / 🛡 ${m.defense}</h4>${this.attackRow(m)}</div>` +
                `</div></div>` +
            `</div>`;
        pop.style.display = 'flex';
        pop.querySelector('.ph-cc-close').onclick = () => this.closePopover();
        this.wireAttackTarget(pop, m.id);
        this.wireLosBtn(pop, m.id);
        pop.querySelector('.ph-hp-dn').onclick = () => this.gs.adjustHp(m.id, -1);
        pop.querySelector('.ph-hp-up').onclick = () => this.gs.adjustHp(m.id, 1);
        pop.querySelectorAll('.ph-stat-dn').forEach(b => b.onclick = () => this.gs.adjustMinion(m.id, b.dataset.stat, -1));
        pop.querySelectorAll('.ph-stat-up').forEach(b => b.onclick = () => this.gs.adjustMinion(m.id, b.dataset.stat, 1));
        pop.querySelector('.ph-min-remove').onclick = () => { this.gs.removeMinion(m.id); this.closePopover(); };
        const go = pop.querySelector('.ph-atk-go');
        if (go) go.onclick = () => { const t = pop.querySelector('.ph-atk-target'); if (t && t.value) this.gs.attack(m.id, t.value, this.app.board.cols, this.app.board.rows); };
    }

    pieceBlock(seat) {
        if (seat.kind !== 'hero') return '';
        const cell = (seat.x != null) ? `${seat.x + 1}-${String.fromCharCode(65 + seat.y)}` : 'off board';
        let inner;
        if (seat.dead) {
            inner = `<div class="ph-hp-dead">☠ Gravestone — revive counter <b>${seat.grave ? seat.grave.count : 0}</b>` +
                `<div class="ph-hp-row"><button class="ph-btn ph-rev-tick">Spend action −1</button>` +
                `<button class="ph-btn ph-btn-go ph-revive">Revive now (life 4)</button></div></div>`;
        } else {
            inner = `<div class="ph-hp-row">` +
                `<button class="ph-btn ph-hp-dn">−</button>` +
                `<span class="ph-hp-val">❤ ${seat.hp}/${seat.maxHp}</span>` +
                `<button class="ph-btn ph-hp-up">+</button>` +
                `<input class="ph-hp-amt" type="number" value="5" min="1" style="width:44px">` +
                `<button class="ph-btn ph-hp-dmg">damage</button>` +
                `<button class="ph-btn ph-btn-warn ph-kill">Down ☠</button></div>`;
        }
        return `<div class="ph-cc-block"><h4>Piece · ${cell}</h4>${inner}` +
            `<div class="ph-muted" style="font-size:10px;margin-top:4px;">Drag the piece on the board to move it.</div></div>`;
    }

    formsBlock(seat, ch) {
        if (!ch || !/TURTLE|CHEETAH|BEAR|DEER/i.test(ch.abilities || '')) return '';
        const forms = ['TURTLE', 'CHEETAH', 'BEAR', 'DEER'];
        const btns = forms.map(f => `<button class="ph-form-btn${seat.form === f ? ' on' : ''}" data-form="${f}">${f}</button>`).join('') +
            `<button class="ph-form-btn${!seat.form ? ' on' : ''}" data-form="">Normal</button>`;
        const allies = this.gs.state.seats.filter(s => s.kind === 'hero' && s.id !== seat.id);
        const allyRow = allies.length ? `<div class="ph-ally-row">Transform ally: ` +
            `<select class="ph-ally-sel">${allies.map(a => `<option value="${a.id}">${esc(a.label)}</option>`).join('')}</select>` +
            `<select class="ph-ally-form">${forms.map(f => `<option>${f}</option>`).join('')}</select>` +
            `<button class="ph-btn ph-ally-go">Apply (this turn)</button></div>` : '';
        return `<div class="ph-cc-block"><h4>Druid forms</h4><div class="ph-forms">${btns}</div>${allyRow}</div>`;
    }

    characterChooser(seat) {
        const d = window.GAME_DATA; if (!d) return '';
        const list = seat.kind === 'monster' ? d.monsters : d.heroes.filter(h => h.color === seat.color);
        if (list.length < 2) return '';
        return `<select class="ph-cc-choose" title="Swap character">` +
            list.map(c => `<option value="${c.id}"${c.id === seat.characterId ? ' selected' : ''}>${esc(c.name)}</option>`).join('') + `</select>`;
    }

    characterDice(seat, ch) {
        if (!ch || !ch.stats) return [];
        const s = ch.stats;
        if (seat.kind === 'monster') {
            const out = [];
            if (s.monsterDie) out.push({ key: 'die', label: 'Die', die: s.monsterDie, grp: 'a' });
            if (s.movementDie) out.push({ key: 'move', label: 'Move', die: s.movementDie, grp: 'm' });
            return out;
        }
        // bonus dice (ba/bm) get their own group so the action/movement group
        // rolls don't sweep them in — bonus dice may only be spent on their bonus.
        const defs = [['a1', 'a1 ☼', 'a'], ['a2', 'a2 ☼', 'a'], ['m1', 'M1 ֍', 'm'], ['m2', 'M2 ֍', 'm'], ['ba', 'BA ☼', 'ba'], ['bm', 'BM ֍', 'bm']];
        return defs.filter(([k]) => s[k]).map(([k, label, grp]) => ({ key: k, label, die: s[k], grp }));
    }

    // ---- discard viewer ---------------------------------------------------
    showDiscard(name) {
        const d = this.gs.state.decks[name]; if (!d || !d.discard.length) return;
        if (this.gs.mySeatId) this.gs.log(`looked at the ${name} discard`, this.gs.mySeatId);
        const cards = d.discard.slice().reverse().map(inst => {
            const c = this.gs.card(inst.cid); return c ? `<div class="ph-card">${this.cardFace(c)}</div>` : '';
        }).join('');
        const pop = document.getElementById('ph-pop');
        pop.innerHTML = `<div class="ph-discard-view"><div class="ph-dv-head"><b>${name} discard (${d.discard.length})</b>` +
            `<button class="ph-cc-close">✕</button></div><div class="ph-cards">${cards}</div></div>`;
        pop.style.display = 'flex';
        pop.querySelector('.ph-cc-close').onclick = () => this.closePopover();
    }

    // ---- card + die rendering --------------------------------------------
    cardArt(c) { return c.art ? `<img class="ph-art" src="${esc(c.art)}" alt="">` : `<div class="ph-noart">${esc(c.name)}</div>`; }
    cardFace(c) {
        const dark = c.deck === 'Black';
        return `<div class="ph-cardface ${dark ? 'blk' : 'wht'}">` +
            `<div class="ph-cf-art">${this.cardArt(c)}</div>` +
            `<div class="ph-cf-info"><div class="ph-cf-top"><span class="ph-cf-cost">${icon(c.cost || '0')}</span>` +
                `<span class="ph-cf-name">${esc(c.name)}</span></div>` +
                `<div class="ph-cf-text">${fmt(c.text || '')}</div></div></div>`;
    }
    dieFace(n) {
        return PH_DICE.includes(Number(n))
            ? `<img class="ph-die-img" src="dice/d${n}.png" alt="d${n}">`
            : `<span class="ph-die-img ph-die-num">d${n}</span>`;
    }
    dieResult(n, value, key) {
        return `<div class="ph-die-res">${this.dieFace(n)}<span class="ph-die-val">${value}</span>` +
            (key ? `<span class="ph-die-tag">${icon(key === 'die' ? '◆' : key)}</span>` : '') + `</div>`;
    }
}

// small shared formatting helpers (reuse GAME_ICONS from designer.js)
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function symbolize(html) {
    if (typeof GAME_ICONS === 'undefined') return html;
    return html.replace(/☼/g, GAME_ICONS.action).replace(/֍/g, GAME_ICONS.move)
               .replace(/◆/g, GAME_ICONS.obj).replace(/◇/g, GAME_ICONS.objOutline);
}
function icon(s) { return symbolize(esc(s)); }
function fmt(s) { return symbolize(esc(s).replace(/\n/g, '<br>')); }
// compact label for a queued modifier chip
function describeModShort(m) {
    const b = [];
    if (m.flat) b.push((m.flat >= 0 ? '+' : '') + m.flat);
    (m.dice || []).forEach(d => b.push('+d' + d.die));
    if (m.attackDice) b.push('+' + m.attackDice + '⚔');
    if (m.defenseDice) b.push('+' + m.defenseDice + '🛡');
    if (m.skull) b.push('+' + m.skull + '☠');
    if (m.shield) b.push('+' + m.shield + '🛡');
    return esc(b.join(' ') || '·');
}
