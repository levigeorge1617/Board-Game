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
            const cx = px * size + size / 2, cy = py * size + size / 2, r = size * 0.34;
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = m.color || '#9b2d2d'; ctx.fill();
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#3a0d0d'; ctx.stroke();
            ctx.fillStyle = '#f2e6e6'; ctx.font = `${size * 0.34}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('☠', cx, cy - size * 0.02);
            this.badge(ctx, cx + r * 0.7, cy + r * 0.7, size, m.hp, '#111', '#9b2d2d', '#fff');
            ctx.restore();
        });
    }

    // Is line-of-sight from cell (x0,y0) to (x1,y1) blocked by a wall edge?
    // A ray between the two cell centers is traced; crossing a wall (edge value 1)
    // blocks it. Doors (value 2) are treated as see-through openings.
    losBlocked(x0, y0, x1, y1) {
        if (x0 === x1 && y0 === y1) return false;
        const edges = this.state.edges;
        const isWall = (key, side) => { const e = edges[key]; return !!(e && e[side] === 1); };
        const ax = x0 + 0.5, ay = y0 + 0.5, bx = x1 + 0.5, by = y1 + 0.5;
        const dx = bx - ax, dy = by - ay;
        // vertical grid-line crossings → the "left" wall of the entered column
        if (dx !== 0) {
            const lo = Math.min(ax, bx), hi = Math.max(ax, bx);
            for (let gx = Math.ceil(lo); gx <= Math.floor(hi); gx++) {
                if (gx <= lo || gx >= hi) continue;
                const t = (gx - ax) / dx, row = Math.floor(ay + dy * t);
                if (isWall(`${gx},${row}`, 'left')) return true;
            }
        }
        // horizontal grid-line crossings → the "top" wall of the entered row
        if (dy !== 0) {
            const lo = Math.min(ay, by), hi = Math.max(ay, by);
            for (let gy = Math.ceil(lo); gy <= Math.floor(hi); gy++) {
                if (gy <= lo || gy >= hi) continue;
                const t = (gy - ay) / dy, col = Math.floor(ax + dx * t);
                if (isWall(`${col},${gy}`, 'top')) return true;
            }
        }
        return false;
    }
    reachOf(ent) {
        if (!ent) return 1;
        if (ent.kind === 'minion') return ent.reach || 1;
        const ch = window.app.play.gs.character(ent);
        return (ch && ch.combat && ch.combat.reach) || 1;
    }

    // Draw the attack-range cells + line-of-sight rays for the inspected piece.
    drawInspect(ctx, size) {
        const play = window.app.play;
        const ent = play.gs.combatant(window.app.inspectPieceId);
        if (!ent || ent.x == null || ent.dead) return;
        const reach = this.reachOf(ent);
        const cx = ent.x * size + size / 2, cy = ent.y * size + size / 2;
        const cols = this.state.cols, rows = this.state.rows;

        ctx.save();
        // range cells within reach (Chebyshev), tinted by whether LoS is clear
        for (let yy = Math.max(0, ent.y - reach); yy <= Math.min(rows - 1, ent.y + reach); yy++) {
            for (let xx = Math.max(0, ent.x - reach); xx <= Math.min(cols - 1, ent.x + reach); xx++) {
                if (xx === ent.x && yy === ent.y) continue;
                const clear = !this.losBlocked(ent.x, ent.y, xx, yy);
                ctx.fillStyle = clear ? 'rgba(70,198,166,0.20)' : 'rgba(120,130,140,0.12)';
                ctx.fillRect(xx * size, yy * size, size, size);
            }
        }
        // range boundary ring
        ctx.strokeStyle = 'rgba(70,198,166,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.strokeRect((ent.x - reach) * size, (ent.y - reach) * size, (reach * 2 + 1) * size, (reach * 2 + 1) * size);
        ctx.setLineDash([]);

        // line-of-sight rays to every enemy on the board
        (play.enemiesOf(ent) || []).forEach(e => {
            const ex = e.x * size + size / 2, ey = e.y * size + size / 2;
            const blocked = this.losBlocked(ent.x, ent.y, e.x, e.y);
            const dist = Math.max(Math.abs(ent.x - e.x), Math.abs(ent.y - e.y));
            const inRange = dist <= reach;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
            ctx.lineWidth = 2.5;
            if (blocked) { ctx.strokeStyle = 'rgba(220,70,70,0.85)'; ctx.setLineDash([6, 5]); }
            else { ctx.strokeStyle = inRange ? 'rgba(224,168,0,0.95)' : 'rgba(70,198,166,0.85)'; ctx.setLineDash([]); }
            ctx.stroke(); ctx.setLineDash([]);
            // mark a target you can actually hit (clear LoS + within reach)
            if (!blocked && inRange) {
                ctx.beginPath(); ctx.arc(ex, ey, size * 0.5, 0, Math.PI * 2);
                ctx.strokeStyle = '#e0a800'; ctx.lineWidth = 3; ctx.stroke();
            }
        });
        ctx.restore();
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