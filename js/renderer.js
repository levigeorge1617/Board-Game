class Renderer {
    constructor(canvas, boardState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = boardState;
        this.panX = 50; this.panY = 50; this.zoom = 1.0;
        this.minZoom = 0.1; this.maxZoom = 3.0;
        this.imgCache = {};
    }

    getImg(src) {
        if (!src) return null;
        if (this.imgCache[src]) return this.imgCache[src];
        const img = new Image();
        img.onload = () => this.draw();
        img.src = src;
        this.imgCache[src] = img;
        return img;
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.draw();
    }

    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.panX) / this.zoom;
        const worldY = (screenY - this.panY) / this.zoom;
        return {
            cellX: Math.floor(worldX / this.state.cellSize),
            cellY: Math.floor(worldY / this.state.cellSize),
            localX: worldX % this.state.cellSize,
            localY: worldY % this.state.cellSize
        };
    }

    draw(stampTemplate = null, stampX = 0, stampY = 0, selectionBox = null) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        const size = this.state.cellSize;

        // 1. Paint Tileset Floor Textures
        const tilesetColors = {
            'grass': '#345e37', 'mud': '#5c4033', 'path': '#7a6b58',
            'tile': '#8b2500', 'wood': '#a0522d', 'stone': '#555555'
        };

        for (let r = 0; r < this.state.rows; r++) {
            for (let c = 0; c < this.state.cols; c++) {
                const terrainType = this.state.floors[`${c},${r}`];
                if (terrainType && tilesetColors[terrainType]) {
                    ctx.fillStyle = tilesetColors[terrainType];
                    ctx.fillRect(c * size, r * size, size, size);
                } else {
                    ctx.fillStyle = '#161a1d';
                    ctx.fillRect(c * size, r * size, size, size);
                }
            }
        }

        // 1.5 Render Selected Column & Row Highlights 
        if (window.app && window.app.appMode === 'play') {
            ctx.fillStyle = 'rgba(0, 204, 255, 0.15)';
            if (window.app.highlightedCol !== null && window.app.highlightedCol < this.state.cols) {
                ctx.fillRect(window.app.highlightedCol * size, 0, size, this.state.rows * size);
            }
            if (window.app.highlightedRow !== null && window.app.highlightedRow < this.state.rows) {
                ctx.fillRect(0, window.app.highlightedRow * size, this.state.cols * size, size);
            }
        }

        // 2. Active Template Stamp Preview Layer
        if (stampTemplate) {
            ctx.fillStyle = 'rgba(0, 122, 204, 0.2)';
            Object.keys(stampTemplate.floors || {}).forEach(k => {
                const [cx, cy] = k.split(',').map(Number);
                ctx.fillRect((stampX + cx) * size, (stampY + cy) * size, size, size);
            });
        }

        // 3. Render Grid System Lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let c = 0; c <= this.state.cols; c++) { ctx.moveTo(c * size, 0); ctx.lineTo(c * size, this.state.rows * size); }
        for (let r = 0; r <= this.state.rows; r++) { ctx.moveTo(0, r * size); ctx.lineTo(this.state.cols * size, r * size); }
        ctx.stroke();

        // 4. Grid Coordinate System Labels 
        ctx.save();
        ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;

        for (let c = 0; c < this.state.cols; c++) {
            const isTargeted = window.app && window.app.appMode === 'play' && window.app.highlightedCol === c;
            ctx.fillStyle = isTargeted ? '#00ccff' : '#b0b6bd';
            ctx.fillText(c + 1, c * size + size / 2, -16);
        }
        for (let r = 0; r < this.state.rows; r++) {
            const letter = String.fromCharCode(65 + r); 
            const isTargeted = window.app && window.app.appMode === 'play' && window.app.highlightedRow === r;
            ctx.fillStyle = isTargeted ? '#00ccff' : '#b0b6bd';
            ctx.fillText(letter, -18, r * size + size / 2);
        }
        ctx.restore(); 

        // 5. Draw Structural Walls & Doors
        const drawEdgeLayer = (edgesMap, ox = 0, oy = 0, isPreview = false) => {
            Object.keys(edgesMap).forEach(key => {
                const [x, y] = key.split(',').map(Number);
                const edge = edgesMap[key]; const cx = (x + ox) * size; const cy = (y + oy) * size;
                if (edge.top > 0) {
                    ctx.strokeStyle = edge.top === 1 ? (isPreview ? '#00ccff' : '#9aa7b5') : '#ffcc00';
                    ctx.lineWidth = edge.top === 1 ? 5 : 7;
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + size, cy); ctx.stroke();
                }
                if (edge.left > 0) {
                    ctx.strokeStyle = edge.left === 1 ? (isPreview ? '#00ccff' : '#9aa7b5') : '#ffcc00';
                    ctx.lineWidth = edge.left === 1 ? 5 : 7;
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + size); ctx.stroke();
                }
            });
        };
        drawEdgeLayer(this.state.edges);
        if (stampTemplate && stampTemplate.edges) drawEdgeLayer(stampTemplate.edges, stampX, stampY, true);

        // 6. Token Layer (Perfectly centered bold values, specialty renders for objectives/locks/keys)
        this.state.tokens.forEach(t => {
            const tx = t.x * size + size / 2;
            const ty = t.y * size + size / 2;
            const radius = size * 0.38;
            
            ctx.save();
            ctx.beginPath(); ctx.arc(tx, ty, radius, 0, Math.PI * 2);
            ctx.fillStyle = t.color; ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();

            // Unique visual identifier ring setups for corresponding Locks and Keys
            if ((t.type === 'lock' || t.type === 'key') && t.matchPattern) {
                ctx.beginPath(); ctx.arc(tx, ty, radius - 4, 0, Math.PI * 2);
                ctx.strokeStyle = t.matchPattern; ctx.lineWidth = 3; ctx.stroke();
            }
            // Objective glow ring indicators
            if (t.type === 'objective') {
                ctx.beginPath(); ctx.arc(tx, ty, radius - 3, 0, Math.PI * 2);
                ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
            }

            // Print counter value directly in the vertical/horizontal center anchor
            const val = (t.hp !== undefined) ? t.hp : 10;
            ctx.fillStyle = (t.color === '#ffff33' || t.type === 'objective') ? '#000000' : '#ffffff';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, tx, ty);
            ctx.restore();
        });

        // 6.4 LoS / range inspector overlay (under the pieces so tokens stay readable)
        if (window.app && window.app.appMode === 'play' && window.app.inspectPieceId &&
            window.app.play && window.app.play.gs.state.started) {
            this.drawInspect(ctx, size);
        }

        // 6.5 Game pieces (heroes/monster/minions) from the synced play state.
        // Shown in play AND design mode (so wired pieces can be pre-placed on a map).
        if (window.app && (window.app.appMode === 'play' || window.app.appMode === 'design') &&
            window.app.play && window.app.play.gs.state.started) {
            this.drawPieces(ctx, size);
        }

        // 7. Render Active Structural Region Template Selection Outlines
        if (selectionBox) {
            ctx.strokeStyle = '#e0a800'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
            ctx.strokeRect(selectionBox.x * size, selectionBox.y * size, selectionBox.w * size, selectionBox.h * size);
            ctx.fillStyle = 'rgba(224, 168, 0, 0.15)'; ctx.fillRect(selectionBox.x * size, selectionBox.y * size, selectionBox.w * size, selectionBox.h * size);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    drawPieces(ctx, size) {
        const play = window.app.play;
        const gs = play.gs;
        const drag = play.dragPiece;
        const FORM_ART = { DEER: 'players/druid1.jpg', BEAR: 'players/druid2.jpg', TURTLE: 'players/druid3.jpg', CHEETAH: 'players/druid4.jpg' };
        const colorOf = (typeof PH_COLOR !== 'undefined') ? PH_COLOR : {};

        // origin marker: while a piece is held, ring where it came from so it can be
        // put back if the move is cancelled.
        if (drag && drag.sx != null && (drag.x !== drag.sx || drag.y !== drag.sy)) {
            const ox = drag.sx * size + size / 2, oy = drag.sy * size + size / 2, r = size * 0.4;
            ctx.save();
            ctx.setLineDash([5, 4]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(224,168,0,0.9)';
            ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]); ctx.fillStyle = 'rgba(224,168,0,0.12)';
            ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(224,168,0,0.95)'; ctx.font = `${size * 0.3}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↩', ox, oy);
            ctx.restore();
        }

        gs.state.seats.forEach(seat => {
            if (seat.x == null || seat.y == null) return;
            let px = seat.x, py = seat.y;
            if (drag && drag.seatId === seat.id) { px = drag.x; py = drag.y; }
            const cx = px * size + size / 2, cy = py * size + size / 2, r = size * 0.42;
            const color = colorOf[seat.color] || '#888';

            ctx.save();
            if (seat.dead) {
                // gravestone
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = '#3a3f43'; ctx.fill();
                ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.stroke();
                ctx.fillStyle = '#cfd6db'; ctx.font = `bold ${size * 0.5}px sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('☠', cx, cy - size * 0.05);
                this.badge(ctx, cx + r * 0.7, cy + r * 0.7, size, seat.grave ? seat.grave.count : 0, '#111', '#e0a800');
            } else {
                const ch = gs.character(seat);
                let art = ch && ch.art;
                if (seat.form && FORM_ART[seat.form]) art = FORM_ART[seat.form];
                const img = art ? this.getImg(art) : null;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.fill();
                if (img && img.complete && img.naturalWidth) {
                    ctx.save(); ctx.clip();
                    const s = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
                    const w = img.naturalWidth * s, h = img.naturalHeight * s;
                    ctx.drawImage(img, cx - w / 2, cy - h / 2 - r * 0.15, w, h);
                    ctx.restore();
                }
                ctx.lineWidth = 3.5; ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
                ctx.lineWidth = 1.5; ctx.strokeStyle = '#0d0f11'; ctx.beginPath(); ctx.arc(cx, cy, r + 1.8, 0, Math.PI * 2); ctx.stroke();
                if (seat.kind === 'hero') this.badge(ctx, cx + r * 0.72, cy + r * 0.72, size, seat.hp, '#111', color, '#fff');
                if (seat.form) {
                    ctx.fillStyle = '#0d0f11cc'; ctx.strokeStyle = color; ctx.lineWidth = 1;
                    const fw = size * 0.62;
                    ctx.beginPath(); ctx.roundRect(cx - fw / 2, cy - r - size * 0.28, fw, size * 0.26, 3); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.font = `bold ${size * 0.17}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(seat.form, cx, cy - r - size * 0.15);
                }
            }
            // name label
            ctx.fillStyle = '#e8ecef'; ctx.font = `${size * 0.2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
            ctx.fillText(seat.label, cx, cy + r + 2);
            ctx.restore();
        });

        // minions (monster-side combat pieces)
        (gs.state.minions || []).forEach(m => {
            if (m.x == null || m.y == null) return;
            let px = m.x, py = m.y;
            if (drag && drag.seatId === m.id) { px = drag.x; py = drag.y; }
            const cx = px * size + size / 2, cy = py * size + size / 2;

            if (m.barrier) {   // Ghathag's obstacle: a gray blocking block, not a fighter
                const bw = size * 0.86, bh = size * 0.86;
                ctx.save();
                ctx.fillStyle = '#6b6f74'; ctx.strokeStyle = '#3a3d41'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 4); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = '#4a4e52'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(cx - bw / 2, cy); ctx.lineTo(cx + bw / 2, cy);
                ctx.moveTo(cx, cy - bh / 2); ctx.lineTo(cx, cy + bh / 2); ctx.stroke();
                this.badge(ctx, cx + bw * 0.42, cy - bh * 0.42, size, m.hp, '#111', '#c8552f', '#fff');
                ctx.restore();
                return;
            }

            const r = size * (m.clone ? 0.42 : 0.34);
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = m.color || '#9b2d2d'; ctx.fill();
            if (m.clone) {   // render the clone with the monster's art, ringed to read as a copy
                const ch = window.GAME_DATA && (window.GAME_DATA.monsters || []).find(x => x.id === m.characterId);
                const img = ch && ch.art ? this.getImg(ch.art) : null;
                if (img && img.complete && img.naturalWidth) {
                    ctx.save(); ctx.clip();
                    const sc = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
                    ctx.drawImage(img, cx - img.naturalWidth * sc / 2, cy - img.naturalHeight * sc / 2 - r * 0.15, img.naturalWidth * sc, img.naturalHeight * sc);
                    ctx.restore();
                }
                ctx.lineWidth = 3; ctx.strokeStyle = '#ff6b6b'; ctx.setLineDash([4, 3]);
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = '#ffd7d7'; ctx.font = `${size * 0.18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('clone', cx, cy + r + 1);
            } else if (m.pet) {   // a hero-side pet: gold, paw glyph, name below
                ctx.lineWidth = 2.5; ctx.strokeStyle = '#7a5c10'; ctx.stroke();
                ctx.fillStyle = '#3a2e08'; ctx.font = `${size * 0.32}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🐾', cx, cy);
                this.badge(ctx, cx + r * 0.7, cy + r * 0.7, size, m.hp, '#111', '#d9a520', '#fff');
                ctx.fillStyle = '#e8ecef'; ctx.font = `${size * 0.18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.fillText(m.label || 'Pet', cx, cy + r + 1);
            } else {
                ctx.lineWidth = 2.5; ctx.strokeStyle = '#3a0d0d'; ctx.stroke();
                ctx.fillStyle = '#f2e6e6'; ctx.font = `${size * 0.34}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('☠', cx, cy - size * 0.02);
                this.badge(ctx, cx + r * 0.7, cy + r * 0.7, size, m.hp, '#111', '#9b2d2d', '#fff');
            }
            ctx.restore();
        });
    }

    // Is line-of-sight from cell (x0,y0) to (x1,y1) blocked? A ray between the two
    // cell centers is traced. It is blocked by a wall OR a door edge (value >= 1),
    // or by any object/token or piece sitting in an intermediate cell.
    losBlocked(x0, y0, x1, y1, ignoreCover) {
        if (x0 === x1 && y0 === y1) return false;
        if (ignoreCover) return false;   // Maraurn'Zol's meteor burns through walls & objects
        const edges = this.state.edges;
        const blockEdge = (key, side) => { const e = edges[key]; return !!(e && e[side] >= 1); };  // wall(1) or door(2)
        const ax = x0 + 0.5, ay = y0 + 0.5, bx = x1 + 0.5, by = y1 + 0.5;
        const dx = bx - ax, dy = by - ay;
        // vertical grid-line crossings → the "left" edge of the entered column
        if (dx !== 0) {
            const lo = Math.min(ax, bx), hi = Math.max(ax, bx);
            for (let gx = Math.ceil(lo); gx <= Math.floor(hi); gx++) {
                if (gx <= lo || gx >= hi) continue;
                const t = (gx - ax) / dx, row = Math.floor(ay + dy * t);
                if (blockEdge(`${gx},${row}`, 'left')) return true;
            }
        }
        // horizontal grid-line crossings → the "top" edge of the entered row
        if (dy !== 0) {
            const lo = Math.min(ay, by), hi = Math.max(ay, by);
            for (let gy = Math.ceil(lo); gy <= Math.floor(hi); gy++) {
                if (gy <= lo || gy >= hi) continue;
                const t = (gy - ay) / dy, col = Math.floor(ax + dx * t);
                if (blockEdge(`${col},${gy}`, 'top')) return true;
            }
        }
        // objects/tokens (barriers, locks, objectives…) and pieces in an intermediate
        // cell break line of sight — endpoints (the looker and the target) don't.
        const gs = window.app && window.app.play && window.app.play.gs;
        const occupied = (cx, cy) => {
            if ((cx === x0 && cy === y0) || (cx === x1 && cy === y1)) return false;
            if (this.state.tokens.some(t => t.x === cx && t.y === cy)) return true;
            if (gs && gs.state.seats.some(s => s.x === cx && s.y === cy && !s.dead)) return true;
            if (gs && (gs.state.minions || []).some(m => m.x === cx && m.y === cy)) return true;
            return false;
        };
        const n = Math.ceil(Math.hypot(dx, dy) * 3) + 1;
        for (let i = 1; i < n; i++) {
            const t = i / n, cx = Math.floor(ax + dx * t), cy = Math.floor(ay + dy * t);
            if (occupied(cx, cy)) return true;
        }
        return false;
    }
    // Resolve a piece's live SIGHT (how far it can see) and REACH (how far it can
    // attack), both objective-scaled, via the shared reducer helpers.
    inspectStats(ent) {
        const play = window.app.play, data = window.GAME_DATA, GL = window.GameLogic;
        const score = GL.scoreOf(play.gs.state), monChar = GL.monsterCharOf(play.gs.state, data);
        const ch = GL.charSheetOf(ent, data);
        return {
            sight: GL.effectiveSight(ent, data, score, monChar),
            reach: GL.effectiveReach(ent, data, score, monChar),
            blast: GL.effectiveBlast(ent, data, score),
            ignoreCover: !!(ch && ch.combat && (ch.combat.ignoreCover || ch.combat.ignoreCoverAttack)),
            diagonal: GL.canDiagonal(ent),
        };
    }
    reachOf(ent) { return ent ? this.inspectStats(ent).reach : 1; }

    // Draw the SIGHT area (what it can see) + REACH area (what it can attack) +
    // line-of-sight rays with a distance label on every enemy — even out of sight.
    // SEEN = within sight + clear line; IN RANGE = within reach + clear line.
    drawInspect(ctx, size) {
        const play = window.app.play;
        const ent = play.gs.combatant(window.app.inspectPieceId);
        if (!ent || ent.x == null || ent.dead) return;
        const { sight, reach, blast, ignoreCover } = this.inspectStats(ent);
        const green = window.GameLogic.canDiagonal(ent);   // GREEN also moves diagonally
        const cx = ent.x * size + size / 2, cy = ent.y * size + size / 2;
        const cols = this.state.cols, rows = this.state.rows;
        const span = Math.max(sight, reach, blast);
        // range/sight/reach are measured as a SQUARE (a space in any direction,
        // diagonals included) — Chebyshev distance — for every piece.
        const rangeDist = (x, y) => Math.max(Math.abs(ent.x - x), Math.abs(ent.y - y));

        ctx.save();
        // shade every cell by how the piece relates to it: in reach (attack) >
        // in sight (seen) > (blast hazard for a meteor monster). LoS-blocked cells
        // within sight are shown faint so cover reads at a glance.
        for (let yy = Math.max(0, ent.y - span); yy <= Math.min(rows - 1, ent.y + span); yy++) {
            for (let xx = Math.max(0, ent.x - span); xx <= Math.min(cols - 1, ent.x + span); xx++) {
                if (xx === ent.x && yy === ent.y) continue;
                const d = rangeDist(xx, yy);
                const clear = !this.losBlocked(ent.x, ent.y, xx, yy, ignoreCover);
                let fill = null;
                if (clear && d <= reach) fill = 'rgba(224,90,60,0.30)';          // in range / can be hit
                else if (clear && d <= sight) fill = 'rgba(224,168,0,0.16)';     // seen (not in range)
                else if (d <= sight) fill = 'rgba(120,130,140,0.10)';           // in sight distance but cover blocks
                if (fill) { ctx.fillStyle = fill; ctx.fillRect(xx * size, yy * size, size, size); }
            }
        }
        // meteor blast hazard ring around the piece (Maraurn'Zol)
        if (blast > 0) {
            ctx.strokeStyle = 'rgba(255,90,60,0.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([3, 3]);
            this.strokeRange(ctx, ent.x, ent.y, blast, size, green); ctx.setLineDash([]);
        }
        // sight + reach boundary outlines — a SQUARE for everyone; the GREEN piece
        // also gets a diamond (its diagonal move) drawn over the square.
        ctx.strokeStyle = 'rgba(224,168,0,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        this.strokeRange(ctx, ent.x, ent.y, sight, size, green);
        ctx.strokeStyle = 'rgba(224,90,60,0.9)'; ctx.setLineDash([]);
        this.strokeRange(ctx, ent.x, ent.y, reach, size, green);

        // rays + distance badge to every enemy (seen/in-range/out-of-sight colored)
        (play.enemiesOf(ent) || []).forEach(e => {
            const ex = e.x * size + size / 2, ey = e.y * size + size / 2;
            const blocked = this.losBlocked(ent.x, ent.y, e.x, e.y, ignoreCover);
            const d = rangeDist(e.x, e.y);
            const inRange = !blocked && d <= reach;
            const seen = !blocked && d <= sight;
            let col = 'rgba(150,160,170,0.5)';                 // out of sight / behind cover
            if (inRange) col = 'rgba(224,90,60,0.95)';
            else if (seen) col = 'rgba(224,168,0,0.95)';
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
            ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.setLineDash(seen ? [] : [6, 5]);
            ctx.stroke(); ctx.setLineDash([]);
            if (inRange) { ctx.beginPath(); ctx.arc(ex, ey, size * 0.5, 0, Math.PI * 2); ctx.strokeStyle = '#e05a3c'; ctx.lineWidth = 3; ctx.stroke(); }
            // distance number on the enemy (top-left) — shows even when out of sight
            const bg = inRange ? '#e05a3c' : (seen ? '#e0a800' : '#5b636b');
            this.badge(ctx, ex - size * 0.42, ey - size * 0.42, size, d, '#0d0f11', bg, '#fff');
        });
        // second-pick: shortest-path step count to a chosen empty cell
        if (window.app.pathTargetCell) this.drawPathTo(ctx, size, ent);
        ctx.restore();
    }

    // ---- movement pathing (for the "count of spaces" second-pick) ---------
    // A wall edge (value 1) blocks a step; a door (2) is passable. Orthogonal for
    // everyone; the GREEN hero may also cut diagonally.
    edgeOpen(x0, y0, x1, y1) {
        const e = this.state.edges, w = (k, s) => e[k] && e[k][s] === 1;
        if (x1 === x0 + 1) return !w(`${x1},${y0}`, 'left');
        if (x1 === x0 - 1) return !w(`${x0},${y0}`, 'left');
        if (y1 === y0 + 1) return !w(`${x0},${y1}`, 'top');
        if (y1 === y0 - 1) return !w(`${x0},${y0}`, 'top');
        return true;
    }
    movePassableStep(x, y, nx, ny) {
        if (nx !== x && ny !== y)   // diagonal: pass if either L-route around the corner is wall-free
            return (this.edgeOpen(x, y, nx, y) && this.edgeOpen(nx, y, nx, ny)) ||
                   (this.edgeOpen(x, y, x, ny) && this.edgeOpen(x, ny, nx, ny));
        return this.edgeOpen(x, y, nx, ny);
    }
    moveBlockedSet(sx, sy, tx, ty) {   // cells you can't walk through (pieces/tokens), minus origin/target
        const gs = window.app.play.gs, set = new Set();
        const add = (x, y) => { if (x == null || (x === sx && y === sy) || (x === tx && y === ty)) return; set.add(x + ',' + y); };
        this.state.tokens.forEach(t => add(t.x, t.y));
        gs.state.seats.forEach(s => { if (!s.dead) add(s.x, s.y); });
        (gs.state.minions || []).forEach(m => add(m.x, m.y));
        return set;
    }
    pathDistance(ent, tx, ty) {
        const cols = this.state.cols, rows = this.state.rows, sx = ent.x, sy = ent.y;
        if (sx === tx && sy === ty) return { dist: 0, path: [[sx, sy]] };
        const diagonal = window.GameLogic.canDiagonal(ent);
        const dirs = diagonal ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const blocked = this.moveBlockedSet(sx, sy, tx, ty), key = (x, y) => x + ',' + y;
        const prev = {}, seen = new Set([key(sx, sy)]), q = [[sx, sy]];
        let head = 0;
        while (head < q.length) {
            const [x, y] = q[head++];
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy, k = key(nx, ny);
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(k)) continue;
                if (!this.movePassableStep(x, y, nx, ny)) continue;
                if (blocked.has(k) && !(nx === tx && ny === ty)) continue;
                seen.add(k); prev[k] = key(x, y);
                if (nx === tx && ny === ty) {
                    const path = []; let cur = k;
                    while (cur) { path.push(cur.split(',').map(Number)); cur = prev[cur]; }
                    return { dist: path.length - 1, path: path.reverse() };
                }
                q.push([nx, ny]);
            }
        }
        return { dist: null, path: null };   // walled off / unreachable
    }
    drawPathTo(ctx, size, ent) {
        const tc = window.app.pathTargetCell; if (!tc) return;
        const { dist, path } = this.pathDistance(ent, tc.x, tc.y);
        if (path && path.length > 1) {
            ctx.save(); ctx.strokeStyle = 'rgba(0,204,255,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([2, 5]); ctx.lineCap = 'round';
            ctx.beginPath();
            path.forEach(([x, y], i) => { const px = (x + 0.5) * size, py = (y + 0.5) * size; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
            ctx.stroke(); ctx.restore();
        }
        const cx = (tc.x + 0.5) * size, cy = (tc.y + 0.5) * size;
        ctx.save();
        ctx.fillStyle = dist == null ? 'rgba(200,70,70,0.22)' : 'rgba(0,204,255,0.20)';
        ctx.fillRect(tc.x * size, tc.y * size, size, size);
        ctx.strokeStyle = dist == null ? '#c84646' : '#00ccff'; ctx.lineWidth = 2.5;
        ctx.strokeRect(tc.x * size + 2, tc.y * size + 2, size - 4, size - 4);
        const label = dist == null ? '✕' : String(dist);
        ctx.font = `bold ${size * 0.5}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = '#04121a'; ctx.strokeText(label, cx, cy);
        ctx.fillStyle = '#fff'; ctx.fillText(label, cx, cy);
        ctx.restore();
    }

    // Outline the range as a SQUARE (a space in any direction). The GREEN piece,
    // which also moves diagonally, additionally gets a diamond drawn over the box.
    strokeRange(ctx, gx, gy, range, size, green) {
        if (range <= 0) return;
        const cx = (gx + 0.5) * size, cy = (gy + 0.5) * size, e = (range + 0.5) * size;
        ctx.beginPath(); ctx.rect(cx - e, cy - e, e * 2, e * 2); ctx.stroke();
        if (green) {
            ctx.beginPath();
            ctx.moveTo(cx, cy - e); ctx.lineTo(cx + e, cy); ctx.lineTo(cx, cy + e); ctx.lineTo(cx - e, cy); ctx.closePath();
            ctx.stroke();
        }
    }

    badge(ctx, x, y, size, text, textColor, bg, ring) {
        const br = size * 0.2;
        ctx.beginPath(); ctx.arc(x, y, br, 0, Math.PI * 2);
        ctx.fillStyle = bg; ctx.fill();
        if (ring) { ctx.lineWidth = 1.5; ctx.strokeStyle = ring; ctx.stroke(); }
        ctx.fillStyle = textColor === '#111' ? '#fff' : textColor;
        ctx.font = `bold ${size * 0.22}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
}