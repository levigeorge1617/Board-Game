class AppController {
    constructor() {
        this.board = new BoardState(90, 26);
        this.canvas = document.getElementById('boardCanvas');
        this.renderer = new Renderer(this.canvas, this.board);
        this.designer = new Designer(this);
        this.play = new PlayController(this);
        this.ui = new UIManager(this);

        this.appMode = 'play'; 
        this.currentTool = 'pan'; 
        this.selectedTerrain = 'grass';
        
        this.highlightedRow = null; 
        this.highlightedCol = null; 

        this.isPanning = false;
        this.isSelecting = false;
        this.draggedToken = null;
        this.activeLibraryItem = null;
        this.selectedTokenForMenu = null;
        
        this.activeTemplate = null;
        this.currentMouseCell = { x: 0, y: 0 };
        this.selectStartCell = null;
        this.selectionBox = null;

        this.initCanvasEvents();
        this.initTouchEvents();
        this.initHTML5DropEvents();
        window.addEventListener('resize', () => this.renderer.resizeCanvas());
        this.renderer.resizeCanvas();

        // Board layout (walls/floors/tokens) rides along in the synced game state,
        // so the "drawn" map persists across sessions and syncs to other players.
        this._lastBoardSnap = null;
        this.play.gs.subscribe(() => this.applyBoardFromState());
        this.applyBoardFromState();                       // load a persisted/remote map on start
        setInterval(() => this.pushBoardToState(), 1500); // debounced push of local edits

        if (this.appMode === 'play') this.play.activate();
    }

    boardSnapshot() {
        return JSON.stringify({ cols: this.board.cols, rows: this.board.rows, tokens: this.board.tokens, edges: this.board.edges, floors: this.board.floors });
    }
    applyBoardFromState() {
        const b = this.play.gs.state.board; if (!b) return;
        const incoming = JSON.stringify(b);
        if (incoming === this._lastBoardSnap) return;     // our own push or already applied
        this._lastBoardSnap = incoming;
        this.board.applySnapshot(incoming);
        this.ui.updateGridInputs(this.board.cols, this.board.rows);
        this.renderer.draw();
    }
    pushBoardToState() {
        const snap = this.boardSnapshot();
        if (snap === this._lastBoardSnap) return;         // unchanged since last sync
        this._lastBoardSnap = snap;
        this.play.gs.setBoard(JSON.parse(snap));
    }

    setLibraryDragItem(itemData) { this.activeLibraryItem = itemData; }

    deleteTemplate(name) {
        const templates = JSON.parse(localStorage.getItem('board_editor_templates') || '{}');
        delete templates[name];
        localStorage.setItem('board_editor_templates', JSON.stringify(templates));
        if (this.currentTool === 'stamp') {
            this.currentTool = 'pan';
            this.ui.setActiveTool('pan');
            this.activeTemplate = null;
        }
        this.renderer.draw();
    }

    saveRegionAsTemplate(x, y, w, h) {
        const name = prompt("Save Selected Area as Template Name:", "Guard Outpost");
        if (!name) return;

        let templateEdges = {}; let templateFloors = {};
        for (let r = y; r < y + h; r++) {
            for (let c = x; c < x + w; c++) {
                if (this.board.floors[`${c},${r}`]) templateFloors[`${c - x},${r - y}`] = this.board.floors[`${c},${r}`];
                if (this.board.edges[`${c},${r}`]) templateEdges[`${c - x},${r - y}`] = JSON.parse(JSON.stringify(this.board.edges[`${c},${r}`]));
            }
        }
        for (let r = y; r <= y + h; r++) {
            if (this.board.edges[`${x+w},${r}`]?.left) {
                if (!templateEdges[`${w},${r - y}`]) templateEdges[`${w},${r - y}`] = { top: 0, left: 0 };
                templateEdges[`${w},${r - y}`].left = this.board.edges[`${x+w},${r}`].left;
            }
        }
        for (let c = x; c <= x + w; c++) {
            if (this.board.edges[`${c},${y+h}`]?.top) {
                if (!templateEdges[`${c - x},${h}`]) templateEdges[`${c - x},${h}`] = { top: 0, left: 0 };
                templateEdges[`${c - x},${h}`].top = this.board.edges[`${c},${y+h}`].top;
            }
        }

        const templates = JSON.parse(localStorage.getItem('board_editor_templates') || '{}');
        templates[name] = { edges: templateEdges, floors: templateFloors, width: w, height: h };
        localStorage.setItem('board_editor_templates', JSON.stringify(templates));
        this.ui.renderTemplatesShelf();
    }

    selectTemplate(name) {
        if (this.appMode !== 'design') return;
        const templates = JSON.parse(localStorage.getItem('board_editor_templates') || '{}');
        if (templates[name]) {
            this.activeTemplate = templates[name];
            this.currentTool = 'stamp';
        }
    }

    rotateTemplate() {
        if (!this.activeTemplate) return;
        let newEdges = {}; let newFloors = {};
        const w = this.activeTemplate.width; const h = this.activeTemplate.height;
        Object.keys(this.activeTemplate.floors || {}).forEach(k => {
            const [x, y] = k.split(',').map(Number); newFloors[`${h - 1 - y},${x}`] = this.activeTemplate.floors[k];
        });
        Object.keys(this.activeTemplate.edges || {}).forEach(k => {
            const [x, y] = k.split(',').map(Number); const edge = this.activeTemplate.edges[k];
            if (edge.top) { const nx = h - y; if (!newEdges[`${nx},${x}`]) newEdges[`${nx},${x}`] = { top: 0, left: 0 }; newEdges[`${nx},${x}`].left = edge.top; }
            if (edge.left) { const nx = h - 1 - y; if (!newEdges[`${nx},${x}`]) newEdges[`${nx},${x}`] = { top: 0, left: 0 }; newEdges[`${nx},${x}`].top = edge.left; }
        });
        this.activeTemplate.edges = newEdges; this.activeTemplate.floors = newFloors; this.activeTemplate.width = h; this.activeTemplate.height = w;
        this.renderer.draw(this.activeTemplate, this.currentMouseCell.x, this.currentMouseCell.y);
    }

    flipTemplate() {
        if (!this.activeTemplate) return;
        let newEdges = {}; let newFloors = {}; const w = this.activeTemplate.width;
        Object.keys(this.activeTemplate.floors || {}).forEach(k => {
            const [x, y] = k.split(',').map(Number); newFloors[`${w - 1 - x},${y}`] = this.activeTemplate.floors[k];
        });
        Object.keys(this.activeTemplate.edges || {}).forEach(k => {
            const [x, y] = k.split(',').map(Number); const edge = this.activeTemplate.edges[k];
            if (edge.top) { const nx = w - 1 - x; if (!newEdges[`${nx},${y}`]) newEdges[`${nx},${y}`] = { top: 0, left: 0 }; newEdges[`${nx},${y}`].top = edge.top; }
            if (edge.left) { const nx = w - x; if (!newEdges[`${nx},${y}`]) newEdges[`${nx},${y}`] = { top: 0, left: 0 }; newEdges[`${nx},${y}`].left = edge.left; }
        });
        this.activeTemplate.edges = newEdges; this.activeTemplate.floors = newFloors;
        this.renderer.draw(this.activeTemplate, this.currentMouseCell.x, this.currentMouseCell.y);
    }

    showHPPopover(token, screenX, screenY) {
        this.selectedTokenForMenu = token;
        const popover = document.getElementById('hp-popover');
        popover.style.display = 'flex';
        popover.style.left = `${screenX + 15}px`;
        popover.style.top = `${screenY - 40}px`;
        document.getElementById('popover-hp-input').value = token.hp !== undefined ? token.hp : 10;
    }

    hideHPPopover() {
        document.getElementById('hp-popover').style.display = 'none';
        this.selectedTokenForMenu = null;
    }

    savePopoverHP() {
        if (this.selectedTokenForMenu) {
            this.board.saveHistory();
            this.selectedTokenForMenu.hp = parseInt(document.getElementById('popover-hp-input').value, 10);
            if (isNaN(this.selectedTokenForMenu.hp)) this.selectedTokenForMenu.hp = 0;
            this.hideHPPopover();
            this.renderer.draw();
        }
    }

    deletePopoverToken() {
        if (this.selectedTokenForMenu) {
            this.board.saveHistory();
            this.board.tokens = this.board.tokens.filter(t => t.id !== this.selectedTokenForMenu.id);
            this.hideHPPopover();
            this.renderer.draw();
        }
    }

    executeBucketFill(startX, startY, targetTerrain) {
        if (startX < 0 || startX >= this.board.cols || startY < 0 || startY >= this.board.rows) return;
        const sourceTerrain = this.board.floors[`${startX},${startY}`] || 'empty';
        if (sourceTerrain === targetTerrain) return;

        this.board.saveHistory();
        const queue = [[startX, startY]];
        const visited = new Set([`${startX},${startY}`]);

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            this.board.floors[`${cx},${cy}`] = targetTerrain;

            const neighbors = [
                { x: cx,     y: cy - 1, dir: 'top',  ex: cx,     ey: cy },     
                { x: cx,     y: cy + 1, dir: 'top',  ex: cx,     ey: cy + 1 }, 
                { x: cx - 1, y: cy,     dir: 'left', ex: cx,     ey: cy },     
                { x: cx + 1, y: cy,     dir: 'left', ex: cx + 1, ey: cy }      
            ];

            for (const n of neighbors) {
                if (n.x < 0 || n.x >= this.board.cols || n.y < 0 || n.y >= this.board.rows) continue;
                const key = `${n.x},${n.y}`;
                if (visited.has(key)) continue;

                const edgeKey = `${n.ex},${n.ey}`;
                const structuralEdge = this.board.edges[edgeKey];
                const isBlocked = structuralEdge && structuralEdge[n.dir] > 0;

                if (!isBlocked) {
                    const checkTerrain = this.board.floors[key] || 'empty';
                    if (checkTerrain === sourceTerrain) {
                        visited.add(key);
                        queue.push([n.x, n.y]);
                    }
                }
            }
        }
    }

    getRandomUniqueColor() {
        const hues = [0, 30, 60, 120, 180, 220, 270, 320];
        const randomHue = hues[Math.floor(Math.random() * hues.length)];
        return `hsl(${randomHue}, 95%, 50%)`;
    }

    initHTML5DropEvents() {
        this.canvas.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault(); if (!this.activeLibraryItem) return;
            const rect = this.canvas.getBoundingClientRect();
            const { cellX, cellY } = this.renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            this.placeLibraryItem(cellX, cellY);
            this.activeLibraryItem = null;
        });
    }

    // Place the currently-selected palette item at a cell. Shared by desktop
    // drag-drop and touch tap-to-place. Leaves activeLibraryItem for the caller to clear.
    placeLibraryItem(cellX, cellY) {
        if (!this.activeLibraryItem) return;
        {
            if (cellX >= 0 && cellX < this.board.cols && cellY >= 0 && cellY < this.board.rows) {
                this.board.saveHistory();

                // Lock Piece dropped logic handler
                if (this.activeLibraryItem.type === 'lock') {
                    const uniqueAccent = this.getRandomUniqueColor();
                    // Place Lock Token on targeted coordinate cell
                    this.board.tokens.push({
                        id: Date.now(), type: 'lock', x: cellX, y: cellY,
                        color: '#222222', label: '', hp: 10, matchPattern: uniqueAccent
                    });
                    // Instantly generate and place its corresponding paired color Key on an adjacent free cell
                    const kx = (cellX + 1 < this.board.cols) ? cellX + 1 : cellX - 1;
                    this.board.tokens.push({
                        id: Date.now() + 1, type: 'key', x: kx, y: cellY,
                        color: '#b59410', label: '', hp: 10, matchPattern: uniqueAccent
                    });
                } 
                // Objective batch processing tool drops logic handler
                else if (this.activeLibraryItem.type === 'objective') {
                    let countInput = prompt("How many objective targets would you like to distribute over the field? (Enter 6 - 10)", "6");
                    let count = parseInt(countInput, 10);
                    if (isNaN(count) || count < 6) count = 6;
                    if (count > 10) count = 10;

                    let currentX = cellX;
                    for (let i = 0; i < count; i++) {
                        if (currentX >= this.board.cols) break;
                        const randomRoll = Math.floor(Math.random() * 5) + 2; // Rolls 2-6 randomly
                        this.board.tokens.push({
                            id: Date.now() + i, type: 'objective', x: currentX, y: cellY,
                            color: '#00ffff', label: '', hp: randomRoll
                        });
                        currentX++; // Spread across row automatically on dropped canvas site
                    }
                }
                // Minion → a real synced combat piece (not a static board token)
                else if (this.activeLibraryItem.type === 'minion') {
                    if (this.play && this.play.gs) this.play.gs.addMinion({ x: cellX, y: cellY });
                }
                // Standard structural entity counters logic handler
                else {
                    this.board.tokens.push({
                        id: Date.now() + Math.random(), type: this.activeLibraryItem.type,
                        x: cellX, y: cellY, color: this.activeLibraryItem.color,
                        label: this.activeLibraryItem.label, hp: 10
                    });
                }
                this.renderer.draw();
            }
        }
    }

    // Apply the active design tool at a cell (extracted so touch + mouse share it).
    applyDesignToolAt(cellX, cellY, localX, localY) {
        if (this.currentTool === 'stamp' && this.activeTemplate) {
            this.board.saveHistory();
            Object.keys(this.activeTemplate.edges || {}).forEach(k => {
                const [tx, ty] = k.split(',').map(Number); const gk = `${cellX + tx},${cellY + ty}`;
                if (!this.board.edges[gk]) this.board.edges[gk] = { top: 0, left: 0 };
                if (this.activeTemplate.edges[k].top) this.board.edges[gk].top = this.activeTemplate.edges[k].top;
                if (this.activeTemplate.edges[k].left) this.board.edges[gk].left = this.activeTemplate.edges[k].left;
            });
            Object.keys(this.activeTemplate.floors || {}).forEach(k => {
                const [tx, ty] = k.split(',').map(Number); this.board.floors[`${cellX + tx},${cellY + ty}`] = this.activeTemplate.floors[k];
            });
            this.currentTool = 'pan'; this.ui.setActiveTool('pan'); this.activeTemplate = null;
        } else if (this.currentTool === 'select-box') {
            this.isSelecting = true; this.selectStartCell = { x: cellX, y: cellY }; this.selectionBox = { x: cellX, y: cellY, w: 1, h: 1 };
        } else if (this.currentTool === 'bucket-fill') {
            this.executeBucketFill(cellX, cellY, this.selectedTerrain);
        } else if (this.currentTool.startsWith('floor-')) {
            this.board.setFloor(cellX, cellY, this.selectedTerrain);
        } else if (this.currentTool === 'wall-edge' || this.currentTool === 'door-edge') {
            const mode = this.currentTool === 'wall-edge' ? 1 : 2; const size = this.board.cellSize;
            if (localY < 12) this.board.toggleEdgeStructure(cellX, cellY, 'top', mode);
            else if (localY > size - 12) this.board.toggleEdgeStructure(cellX, cellY + 1, 'top', mode);
            else if (localX < 12) this.board.toggleEdgeStructure(cellX, cellY, 'left', mode);
            else if (localX > size - 12) this.board.toggleEdgeStructure(cellX + 1, cellY, 'left', mode);
        }
    }

    initCanvasEvents() {
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
            const worldCoords = this.renderer.screenToWorld(mouseX, mouseY);
            const { cellX, cellY, localX, localY } = worldCoords;

            const size = this.board.cellSize;
            const rx = (mouseX - this.renderer.panX) / this.renderer.zoom;
            const ry = (mouseY - this.renderer.panY) / this.renderer.zoom;

            // Right Click Event Mapping
            if (e.button === 2) { 
                const targetToken = this.board.tokens.find(t => t.x === cellX && t.y === cellY);
                if (this.appMode === 'play' && targetToken) {
                    this.showHPPopover(targetToken, mouseX, mouseY);
                } else {
                    this.isPanning = true; 
                    this.startX = mouseX - this.renderer.panX; 
                    this.startY = mouseY - this.renderer.panY; 
                    this.hideHPPopover();
                }
                this.renderer.draw(this.currentTool === 'stamp' ? this.activeTemplate : null, cellX, cellY, this.selectionBox);
                return; 
            }

            if (e.button !== 0) return;

            // Gutter Label Target Intersection Router
            if (this.appMode === 'play') {
                let clickedGutter = false;
                if (ry >= -32 && ry < 0 && rx >= 0 && rx < this.board.cols * size) {
                    const targetCol = Math.floor(rx / size);
                    this.highlightedCol = (this.highlightedCol === targetCol) ? null : targetCol;
                    clickedGutter = true;
                } else if (rx >= -32 && rx < 0 && ry >= 0 && ry < this.board.rows * size) {
                    const targetRow = Math.floor(ry / size);
                    this.highlightedRow = (this.highlightedRow === targetRow) ? null : targetRow;
                    clickedGutter = true;
                }

                if (clickedGutter) {
                    this.hideHPPopover(); this.renderer.draw(); return;
                }
            }

            // Design Mode Configuration Branches
            if (this.appMode === 'design') {
                // wired combat pieces (minions) can be repositioned in design mode so
                // maps can pre-place them; grabbing a piece pre-empts the active tool.
                if (this.play && this.play.onPieceDown(cellX, cellY)) {
                    this.hideHPPopover(); this.renderer.draw(); return;
                }
                this.applyDesignToolAt(cellX, cellY, localX, localY);
            }
            // Play Mode Click Interactions
            else {
                // game pieces (synced) take priority over manual board tokens
                if (this.play && this.play.onPieceDown(cellX, cellY)) {
                    this.hideHPPopover();
                    this.renderer.draw();
                    return;
                }
                const targetToken = this.board.tokens.find(t => t.x === cellX && t.y === cellY);
                if (targetToken) {
                    this.draggedToken = targetToken;
                    this.board.saveHistory();
                    this.hideHPPopover();
                } else {
                    this.hideHPPopover();
                }
            }
            this.renderer.draw(this.currentTool === 'stamp' ? this.activeTemplate : null, cellX, cellY, this.selectionBox);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
            const { cellX, cellY } = this.renderer.screenToWorld(mouseX, mouseY);
            this.currentMouseCell = { x: cellX, y: cellY };

            if (this.play && this.play.dragPiece && e.buttons === 1) {
                this.play.onPieceMove(cellX, cellY);
            } else if (this.isPanning && e.buttons === 2) {
                this.renderer.panX = mouseX - this.startX; this.renderer.panY = mouseY - this.startY;
                this.renderer.draw(null, 0, 0, this.selectionBox);
            } else if (this.isSelecting && e.buttons === 1) {
                const x = Math.min(this.selectStartCell.x, cellX); const y = Math.min(this.selectStartCell.y, cellY);
                this.selectionBox = { x, y, w: Math.abs(this.selectStartCell.x - cellX) + 1, h: Math.abs(this.selectStartCell.y - cellY) + 1 };
                this.renderer.draw(null, 0, 0, this.selectionBox);
            } else if (this.draggedToken && e.buttons === 1) {
                if (cellX >= 0 && cellX < this.board.cols && cellY >= 0 && cellY < this.board.rows) {
                    this.draggedToken.x = cellX; this.draggedToken.y = cellY;
                    this.renderer.draw();
                }
            } else if (this.currentTool === 'stamp') {
                this.renderer.draw(this.activeTemplate, cellX, cellY, null);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.isPanning = false;
            if (e.button === 0) {
                if (this.play && this.play.dragPiece) { this.play.onPieceUp(); return; }
                if (this.isSelecting && this.selectionBox) {
                    this.isSelecting = false;
                    this.saveRegionAsTemplate(this.selectionBox.x, this.selectionBox.y, this.selectionBox.w, this.selectionBox.h);
                    this.currentTool = 'pan'; this.ui.setActiveTool('pan'); this.selectionBox = null;
                }
                this.draggedToken = null;
                this.renderer.draw();
            }
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); const rect = this.canvas.getBoundingClientRect();
            const oldZoom = this.renderer.zoom;
            this.renderer.zoom = e.deltaY < 0 ? Math.min(this.renderer.maxZoom, this.renderer.zoom * 1.1) : Math.max(this.renderer.minZoom, this.renderer.zoom / 1.1);
            this.renderer.panX = (e.clientX - rect.left) - ((e.clientX - rect.left) - this.renderer.panX) * (this.renderer.zoom / oldZoom);
            this.renderer.panY = (e.clientY - rect.top) - ((e.clientY - rect.top) - this.renderer.panY) * (this.renderer.zoom / oldZoom);
            this.hideHPPopover();
            this.renderer.draw(this.currentTool === 'stamp' ? this.activeTemplate : null, this.currentMouseCell.x, this.currentMouseCell.y, this.selectionBox);
        }, { passive: false });
    }

    // ---- Touch input (mobile) --------------------------------------------
    // The mouse handlers use right-drag to pan + wheel to zoom, neither of which
    // exist on touch. This adds finger gestures so the board is usable on phones:
    //   • one finger on a piece  → drag it (tap = open its sheet)
    //   • one finger on a token  → drag it
    //   • one finger on empty    → pan (play) / apply the active tool (design)
    //   • tap with a palette item selected → place it
    //   • two fingers            → pinch-zoom + pan
    initTouchEvents() {
        const c = this.canvas;
        this._touch = { pointers: new Map(), mode: null, moved: false, start: null, pinch: null };
        const cellOf = (t) => {
            const rect = c.getBoundingClientRect();
            const mx = t.clientX - rect.left, my = t.clientY - rect.top;
            const w = this.renderer.screenToWorld(mx, my);
            return { mx, my, ...w };
        };
        const centroidDist = () => {
            const p = [...this._touch.pointers.values()];
            if (p.length < 2) return { d: 0, cx: 0, cy: 0 };
            const rect = c.getBoundingClientRect();
            const dx = p[0].x - p[1].x, dy = p[0].y - p[1].y;
            return { d: Math.hypot(dx, dy), cx: (p[0].x + p[1].x) / 2 - rect.left, cy: (p[0].y + p[1].y) / 2 - rect.top };
        };

        c.addEventListener('touchstart', (e) => {
            for (const t of e.changedTouches) this._touch.pointers.set(t.identifier, { x: t.clientX, y: t.clientY });
            const n = this._touch.pointers.size;
            if (n >= 2) {                                   // enter pinch, drop any single gesture
                if (this._touch.mode === 'piece' && this.play) { this.play.dragPiece = null; }
                this._touch.mode = null; this.draggedToken = null; this.isSelecting = false;
                const cd = centroidDist();
                this._touch.pinch = { d: cd.d, cx: cd.cx, cy: cd.cy, zoom: this.renderer.zoom, panX: this.renderer.panX, panY: this.renderer.panY };
                e.preventDefault(); return;
            }
            const t = e.changedTouches[0]; const g = cellOf(t);
            this._touch.moved = false; this._touch.start = g;

            // tap-to-place a selected palette item wins over everything
            if (this.activeLibraryItem) { this._touch.mode = 'place'; e.preventDefault(); return; }

            if (this.appMode === 'design') {
                if (this.play && this.play.onPieceDown(g.cellX, g.cellY)) { this._touch.mode = 'piece'; }
                else if (this.currentTool === 'select-box') { this._touch.mode = 'select'; this.isSelecting = true; this.selectStartCell = { x: g.cellX, y: g.cellY }; this.selectionBox = { x: g.cellX, y: g.cellY, w: 1, h: 1 }; }
                else { this._touch.mode = 'draw'; this.applyDesignToolAt(g.cellX, g.cellY, g.localX, g.localY); this.renderer.draw(); }
                e.preventDefault(); return;
            }
            // play mode
            if (this.play && this.play.onPieceDown(g.cellX, g.cellY)) { this._touch.mode = 'piece'; }
            else {
                const token = this.board.tokens.find(tk => tk.x === g.cellX && tk.y === g.cellY);
                if (token) { this._touch.mode = 'token'; this.draggedToken = token; this.board.saveHistory(); }
                else { this._touch.mode = 'pan'; this._touch.start = { ...g, panX: this.renderer.panX, panY: this.renderer.panY }; }
            }
            this.hideHPPopover();
            e.preventDefault();
        }, { passive: false });

        c.addEventListener('touchmove', (e) => {
            for (const t of e.changedTouches) { const p = this._touch.pointers.get(t.identifier); if (p) { p.x = t.clientX; p.y = t.clientY; } }
            const T = this._touch;
            if (T.pinch && this._touch.pointers.size >= 2) {
                const cd = centroidDist();
                const oldZoom = this.renderer.zoom;
                let z = T.pinch.zoom * (cd.d / (T.pinch.d || 1));
                z = Math.max(this.renderer.minZoom, Math.min(this.renderer.maxZoom, z));
                // zoom about the pinch centroid, then pan by centroid drift
                this.renderer.zoom = z;
                this.renderer.panX = cd.cx - (T.pinch.cx - T.pinch.panX) * (z / T.pinch.zoom);
                this.renderer.panY = cd.cy - (T.pinch.cy - T.pinch.panY) * (z / T.pinch.zoom);
                this.renderer.draw(null, 0, 0, this.selectionBox);
                e.preventDefault(); return;
            }
            const t = e.changedTouches[0]; if (!t) return;
            const g = cellOf(t); T.moved = true;
            if (T.mode === 'piece' && this.play) { this.play.onPieceMove(g.cellX, g.cellY); }
            else if (T.mode === 'token' && this.draggedToken) {
                if (g.cellX >= 0 && g.cellX < this.board.cols && g.cellY >= 0 && g.cellY < this.board.rows) { this.draggedToken.x = g.cellX; this.draggedToken.y = g.cellY; this.renderer.draw(); }
            } else if (T.mode === 'select' && this.selectStartCell) {
                const x = Math.min(this.selectStartCell.x, g.cellX), y = Math.min(this.selectStartCell.y, g.cellY);
                this.selectionBox = { x, y, w: Math.abs(this.selectStartCell.x - g.cellX) + 1, h: Math.abs(this.selectStartCell.y - g.cellY) + 1 };
                this.renderer.draw(null, 0, 0, this.selectionBox);
            } else if (T.mode === 'pan' && T.start) {
                this.renderer.panX = T.start.panX + (t.clientX - (T.start.mx + c.getBoundingClientRect().left));
                this.renderer.panY = T.start.panY + (t.clientY - (T.start.my + c.getBoundingClientRect().top));
                this.renderer.draw(null, 0, 0, this.selectionBox);
            }
            e.preventDefault();
        }, { passive: false });

        const end = (e) => {
            for (const t of e.changedTouches) this._touch.pointers.delete(t.identifier);
            const T = this._touch;
            if (this._touch.pointers.size >= 2) { const cd = centroidDist(); T.pinch = { d: cd.d, cx: cd.cx, cy: cd.cy, zoom: this.renderer.zoom, panX: this.renderer.panX, panY: this.renderer.panY }; e.preventDefault(); return; }
            if (this._touch.pointers.size === 1) {   // 2→1: keep panning with the remaining finger, no jump
                T.pinch = null; const [p] = [...this._touch.pointers.values()]; const rect = c.getBoundingClientRect();
                T.mode = 'pan'; T.moved = true; T.start = { mx: p.x - rect.left, my: p.y - rect.top, panX: this.renderer.panX, panY: this.renderer.panY };
                e.preventDefault(); return;
            }
            // last finger up — finalize
            const tap = !T.moved;
            if (T.mode === 'place' && tap && T.start) { this.placeLibraryItem(T.start.cellX, T.start.cellY); this.activeLibraryItem = null; if (this.ui) this.ui.clearPaletteSelection(); }
            else if (T.mode === 'piece' && this.play) { this.play.onPieceUp(); }
            else if (T.mode === 'token') { this.draggedToken = null; this.renderer.draw(); }
            else if (T.mode === 'select' && this.selectionBox) { this.isSelecting = false; this.saveRegionAsTemplate(this.selectionBox.x, this.selectionBox.y, this.selectionBox.w, this.selectionBox.h); this.currentTool = 'pan'; this.ui.setActiveTool('pan'); this.selectionBox = null; this.renderer.draw(); }
            else if (T.mode === 'pan' && tap && this.appMode === 'play' && T.start) { this.handleGutterTap(T.start); }
            T.mode = null; T.pinch = null; T.start = null; T.moved = false;
            e.preventDefault();
        };
        c.addEventListener('touchend', end, { passive: false });
        c.addEventListener('touchcancel', end, { passive: false });
    }

    // Tap in a play-mode row/column gutter toggles that lane's highlight (mirrors the mouse path).
    handleGutterTap(g) {
        const size = this.board.cellSize;
        const rx = (g.mx - this.renderer.panX) / this.renderer.zoom;
        const ry = (g.my - this.renderer.panY) / this.renderer.zoom;
        if (ry >= -32 && ry < 0 && rx >= 0 && rx < this.board.cols * size) {
            const col = Math.floor(rx / size); this.highlightedCol = (this.highlightedCol === col) ? null : col; this.renderer.draw();
        } else if (rx >= -32 && rx < 0 && ry >= 0 && ry < this.board.rows * size) {
            const row = Math.floor(ry / size); this.highlightedRow = (this.highlightedRow === row) ? null : row; this.renderer.draw();
        }
    }

    handleUndo() { this.board.undo(); this.hideHPPopover(); this.renderer.draw(); }
    handleRedo() { this.board.redo(); this.hideHPPopover(); this.renderer.draw(); }
    handleResize(cols, rows) { this.board.resize(cols, rows); this.renderer.draw(); }
    
    handleSave() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ cols: this.board.cols, rows: this.board.rows, tokens: this.board.tokens, edges: this.board.edges, floors: this.board.floors }));
        const anchor = document.createElement('a'); anchor.setAttribute("href", dataStr); anchor.setAttribute("download", "map_v3.json");
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
    }
    
    handleLoad(file) {
        const reader = new FileReader();
        reader.onload = (evt) => { 
            this.board.saveHistory(); 
            this.board.applySnapshot(evt.target.result); 
            this.ui.updateGridInputs(this.board.cols, this.board.rows); 
            this.hideHPPopover(); 
            this.renderer.draw(); 
        };
        reader.readAsText(file);
    }
}

document.addEventListener("DOMContentLoaded", () => { window.app = new AppController(); });