/*
 * PlayController — the in-game HUD overlaid on the board in Play mode:
 * deck/discard piles, a private hand tray, hero/monster popover cards,
 * a virtual dice roller (each character's own dice) and the monster grid roller.
 * All state lives in GameState (js/gamestate.js) and syncs across tabs.
 */
const PH_BACKS = { White: 'css/CardBACK2.png', Black: 'css/CardBACK.png' };
const PH_EMBLEM = { hero: 'css/good.png', monster: 'css/bad.png' };
const PH_COLOR = { RED: '#ff3333', YELLOW: '#ffd21f', GREEN: '#33cc44', BLUE: '#3366ff', PURPLE: '#9933ff', MONSTER: '#b02a2a' };
const PH_DICE = [4, 6, 8, 10, 12, 20];

class PlayController {
    constructor(app) {
        this.app = app;
        this.gs = new GameState();
        this.openSeatId = null;      // character popover currently open (local)
        this.handHidden = false;
        this.built = false;
        this.dragPiece = null;
        this.gs.subscribe(() => { if (this.app.appMode === 'play') { this.render(); this.app.renderer.draw(); } });
    }

    // ---- board piece dragging (called from AppController canvas events) ---
    pieceAt(x, y) {
        if (!this.gs.state.started) return null;
        const seats = this.gs.state.seats;
        for (let i = seats.length - 1; i >= 0; i--) if (seats[i].x === x && seats[i].y === y) return seats[i].id;
        return null;
    }
    onPieceDown(x, y) {
        const id = this.pieceAt(x, y); if (!id) return false;
        const seat = this.gs.seat(id);
        this.dragPiece = { seatId: id, x, y, sx: seat.x, sy: seat.y };
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
    deactivate() { const h = document.getElementById('play-hud'); if (h) h.style.display = 'none'; }

    build() {
        const hud = document.getElementById('play-hud');
        hud.innerHTML =
            '<div id="ph-roster"></div>' +
            '<div id="ph-roll"></div>' +
            '<div id="ph-decks"></div>' +
            '<div id="ph-log"></div>' +
            '<div id="ph-hand"></div>' +
            '<div id="ph-pop" class="ph-pop" style="display:none;"></div>';
        hud.addEventListener('click', (e) => { if (e.target.id === 'ph-pop') this.closePopover(); });
    }

    render() {
        if (!this.gs.state.started) { this.renderWelcome(); document.getElementById('ph-log').innerHTML = ''; return; }
        this.renderRoster();
        this.renderDecks();
        this.renderHand();
        this.renderRoll();
        this.renderLog();
        if (this.openSeatId) this.renderPopover();
    }

    renderWelcome() {
        const online = this.gs.status === 'online';
        document.getElementById('ph-roster').innerHTML =
            `<div class="ph-bar"><div class="ph-seats"></div><div class="ph-bar-ctl">${this.onlineControl()}</div></div>` +
            `<div class="ph-welcome"><b>Game table</b>` +
            `<p>${online ? 'Connected — anyone in this room can deal.' : 'Play solo/hotseat here, or go online for cross-device play.'}<br>Deal the decks and seat the 5 heroes + monster.</p>` +
            `<button id="ph-new" class="ph-btn ph-btn-go">Deal &amp; start</button></div>`;
        ['ph-roll', 'ph-decks', 'ph-hand'].forEach(id => document.getElementById(id).innerHTML = '');
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
        document.getElementById('ph-roster').innerHTML =
            `<div class="ph-bar">` +
                `<div class="ph-seats">${chips}</div>` +
                `<div class="ph-bar-ctl">` +
                    scoreChip +
                    `<label class="ph-me">You: <select id="ph-myseat">` +
                        `<option value="">— pick seat —</option>` +
                        s.seats.map(seat => `<option value="${seat.id}"${seat.id === this.gs.mySeatId ? ' selected' : ''}>${esc(seat.label)}</option>`).join('') +
                    `</select></label>` +
                    this.onlineControl() +
                    `<button id="ph-next" class="ph-btn ${heroesTurn ? 'ph-turn-hero' : 'ph-turn-mon'}">${heroesTurn ? "Heroes' turn" : "Monster's turn"} ▸ end</button>` +
                    `<button id="ph-reset" class="ph-btn ph-btn-warn">Reset</button>` +
                `</div>` +
            `</div>`;
        document.querySelectorAll('#ph-roster .ph-chip').forEach(b =>
            b.onclick = () => this.openPopover(b.dataset.seat));
        document.getElementById('ph-myseat').onchange = (e) => this.gs.setMySeat(e.target.value || null);
        document.getElementById('ph-next').onclick = () => this.gs.togglePhase();
        document.getElementById('ph-score-up').onclick = () => this.gs.score(1, this.gs.mySeatId);
        document.getElementById('ph-score-dn').onclick = () => this.gs.score(-1, this.gs.mySeatId);
        document.getElementById('ph-reset').onclick = () => { if (confirm('Reset the whole table?')) this.gs.resetGame(); };
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

    // ---- hand (private) ---------------------------------------------------
    renderHand() {
        const seat = this.gs.seat(this.gs.mySeatId);
        const wrap = document.getElementById('ph-hand');
        if (!seat) { wrap.innerHTML = `<div class="ph-hand-empty">Pick your seat to see your hand.</div>`; return; }
        const cards = seat.hand.map(inst => {
            const c = this.gs.card(inst.cid); if (!c) return '';
            return `<div class="ph-card" data-iid="${inst.iid}">` +
                this.cardFace(c) +
                `<div class="ph-card-actions"><button data-play="${inst.iid}">Play ▸ discard</button></div>` +
            `</div>`;
        }).join('');
        wrap.innerHTML =
            `<div class="ph-hand-head">` +
                `<span><b style="color:${PH_COLOR[seat.color]}">${esc(seat.label)}</b> · hand (${seat.hand.length}/10)</span>` +
                `<button id="ph-hide" class="ph-btn">${this.handHidden ? 'Show hand' : 'Hide hand'}</button>` +
            `</div>` +
            `<div class="ph-cards${this.handHidden ? ' hidden' : ''}">${cards || '<div class="ph-hand-empty">Empty — draw from your pile.</div>'}</div>`;
        document.getElementById('ph-hide').onclick = () => { this.handHidden = !this.handHidden; this.renderHand(); };
        wrap.querySelectorAll('[data-play]').forEach(b =>
            b.onclick = (e) => { e.stopPropagation(); this.gs.discard(this.gs.mySeatId, b.dataset.play); });
    }

    // ---- shared roll readout ---------------------------------------------
    renderRoll() {
        const { lastDice, lastGrid } = this.gs.state;
        let html = '';
        if (lastDice) {
            const seat = this.gs.seat(lastDice.seatId);
            const col = seat ? (PH_COLOR[seat.color] || '#888') : '#888';
            const chips = lastDice.rolls.map(r => this.dieResult(r.die, r.value, r.key)).join('');
            html += `<div class="ph-roll-card" style="--c:${col}"><div class="ph-roll-who" style="color:${col}">${esc(seat ? seat.label : '')} rolled</div>` +
                `<div class="ph-roll-dice">${chips}</div>` +
                (lastDice.rolls.length > 1 ? `<div class="ph-roll-total">total ${lastDice.total}</div>` : '') + `</div>`;
        }
        if (lastGrid) {
            html += `<div class="ph-roll-card ph-grid-card" style="--c:${PH_COLOR.MONSTER}"><div class="ph-roll-who" style="color:${PH_COLOR.MONSTER}">Monster target</div>` +
                `<div class="ph-grid-res"><b>${lastGrid.col}</b><b>${esc(lastGrid.row)}</b></div></div>`;
        }
        document.getElementById('ph-roll').innerHTML = html;
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
        const seat = this.gs.seat(this.openSeatId); if (!seat) return this.closePopover();
        const ch = this.gs.character(seat);
        const pop = document.getElementById('ph-pop');
        const col = PH_COLOR[seat.color] || '#888';
        const dice = this.characterDice(seat, ch);

        const diceChips = dice.map(d =>
            `<button class="ph-die-btn" data-die="${d.die}" data-key="${d.key}" title="Roll ${d.key} (d${d.die})">` +
                this.dieFace(d.die) + `<span class="ph-die-k">${icon(d.label)}</span></button>`).join('') || '<span class="ph-muted">no dice set</span>';

        const groups = [];
        const acts = dice.filter(d => d.grp === 'a'); const moves = dice.filter(d => d.grp === 'm');
        if (acts.length) groups.push(`<button class="ph-btn ph-roll-grp" data-grp="a">Roll action ${icon('☼')}</button>`);
        if (moves.length) groups.push(`<button class="ph-btn ph-roll-grp" data-grp="m">Roll movement ${icon('֍')}</button>`);

        const gridBtn = seat.kind === 'monster'
            ? `<button id="ph-roll-grid" class="ph-btn ph-btn-go">Roll grid ▸ #/A</button>` : '';

        const chooser = window.GAME_DATA ? this.characterChooser(seat) : '';

        pop.innerHTML =
            `<div class="ph-charcard" style="--c:${col};${ch && ch.art ? `background-image:url('${esc(ch.art)}')` : ''}">` +
                `<button class="ph-cc-close" title="Close">✕</button>` +
                `<div class="ph-cc-shade"></div>` +
                `<div class="ph-cc-body">` +
                    `<div class="ph-cc-head"><h3>${esc(ch ? ch.name : seat.label)}</h3>` +
                        `<span>${esc(ch ? (ch.color || ch.element || '') : '')}</span>${chooser}</div>` +
                    `<div class="ph-cc-dice">${diceChips}</div>` +
                    `<div class="ph-cc-rollbar">${groups.join('')}${gridBtn}</div>` +
                    this.pieceBlock(seat) +
                    this.formsBlock(seat, ch) +
                    (ch && ch.abilities ? `<div class="ph-cc-block"><h4>Abilities</h4><p>${fmt(ch.abilities)}</p></div>` : '') +
                    (ch && ch.objectiveAbilities ? `<div class="ph-cc-block"><h4>Objective ${icon('◆/◇')}</h4><p>${fmt(ch.objectiveAbilities)}</p></div>` : '') +
                `</div>` +
            `</div>`;
        pop.style.display = 'flex';

        pop.querySelector('.ph-cc-close').onclick = () => this.closePopover();
        pop.querySelectorAll('.ph-die-btn').forEach(b =>
            b.onclick = () => this.gs.rollDice(seat.id, [{ key: b.dataset.key, die: Number(b.dataset.die) }]));
        pop.querySelectorAll('.ph-roll-grp').forEach(b =>
            b.onclick = () => this.gs.rollDice(seat.id, dice.filter(d => d.grp === b.dataset.grp).map(d => ({ key: d.key, die: d.die }))));
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
