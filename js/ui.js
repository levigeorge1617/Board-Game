class UIManager {
    constructor(appController) {
        this.app = appController;
        this.initEventListeners();
        this.initSidebarChrome();
        this.renderTemplatesShelf();
    }

    // Mobile drawer toggle + backdrop, and a desktop drag-to-resize handle.
    initSidebarChrome() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const backdrop = document.getElementById('sidebar-backdrop');
        const closeDrawer = () => { sidebar.classList.remove('open'); if (backdrop) backdrop.classList.remove('show'); };
        const openDrawer = () => { sidebar.classList.add('open'); if (backdrop) backdrop.classList.add('show'); };
        if (toggle) toggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeDrawer() : openDrawer());
        if (backdrop) backdrop.addEventListener('click', closeDrawer);

        // persisted width (desktop)
        try { const w = Number(localStorage.getItem('board_sidebar_w')); if (w >= 220 && w <= 560) sidebar.style.width = w + 'px'; } catch (e) {}
        const handle = document.getElementById('sidebar-resize');
        if (handle) {
            let start = null;
            const pt = e => (e.touches && e.touches[0]) || e;
            const move = e => {
                if (!start) return; const p = pt(e);
                const w = Math.max(220, Math.min(560, start.w + (p.clientX - start.x)));
                sidebar.style.width = w + 'px';
                this.app.renderer.resizeCanvas();
                if (window.DiceTray) window.DiceTray.resize();
                if (e.cancelable) e.preventDefault();
            };
            const up = () => {
                if (!start) return; start = null;
                localStorage.setItem('board_sidebar_w', String(sidebar.offsetWidth));
                document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
            };
            const down = e => {
                e.preventDefault(); const p = pt(e);
                start = { x: p.clientX, w: sidebar.offsetWidth };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
                document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
            };
            handle.addEventListener('mousedown', down);
            handle.addEventListener('touchstart', down, { passive: false });
        }
    }

    initEventListeners() {
        document.getElementById('btn-mode-play').addEventListener('click', () => this.switchSystemMode('play'));
        document.getElementById('btn-mode-design').addEventListener('click', () => this.switchSystemMode('design'));
        document.getElementById('btn-mode-designer').addEventListener('click', () => this.switchSystemMode('designer'));

        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
                this.app.setLibraryDragItem({ type: item.dataset.type, color: item.dataset.color, label: item.dataset.label });
            });
            // Touch has no drag-and-drop: tap a palette item to arm it, then tap the board to place.
            item.addEventListener('click', () => {
                const already = item.classList.contains('selected');
                this.clearPaletteSelection();
                if (already) { this.app.activeLibraryItem = null; return; }
                item.classList.add('selected');
                this.app.setLibraryDragItem({ type: item.dataset.type, color: item.dataset.color, label: item.dataset.label });
            });
        });

        document.getElementById('tool-wall-edge').addEventListener('click', () => this.setActiveTool('wall-edge'));
        document.getElementById('tool-door-edge').addEventListener('click', () => this.setActiveTool('door-edge'));
        document.getElementById('tool-select-box').addEventListener('click', () => this.setActiveTool('select-box'));
        
        // Floor and Bucket tool attachment hooks
        document.getElementById('tool-bucket-fill').addEventListener('click', () => this.setActiveTool('bucket-fill'));
        document.getElementById('tool-floor-grass').addEventListener('click', () => { this.setActiveTool('floor-grass'); this.app.selectedTerrain = 'grass'; });
        document.getElementById('tool-floor-mud').addEventListener('click', () => { this.setActiveTool('floor-mud'); this.app.selectedTerrain = 'mud'; });
        document.getElementById('tool-floor-path').addEventListener('click', () => { this.setActiveTool('floor-path'); this.app.selectedTerrain = 'path'; });
        document.getElementById('tool-floor-tile').addEventListener('click', () => { this.setActiveTool('floor-tile'); this.app.selectedTerrain = 'tile'; });
        document.getElementById('tool-floor-wood').addEventListener('click', () => { this.setActiveTool('floor-wood'); this.app.selectedTerrain = 'wood'; });
        document.getElementById('tool-floor-stone').addEventListener('click', () => { this.setActiveTool('floor-stone'); this.app.selectedTerrain = 'stone'; });
        
        document.getElementById('btn-rot-left').addEventListener('click', () => this.app.rotateTemplate());
        document.getElementById('btn-flip').addEventListener('click', () => this.app.flipTemplate());

        document.getElementById('btn-undo').addEventListener('click', () => this.app.handleUndo());
        document.getElementById('btn-redo').addEventListener('click', () => this.app.handleRedo());
        document.getElementById('btn-resize').addEventListener('click', () => {
            this.app.handleResize(parseInt(document.getElementById('grid-cols').value, 10), parseInt(document.getElementById('grid-rows').value, 10));
        });

        document.getElementById('btn-save').addEventListener('click', () => this.app.handleSave());
        document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => { if (e.target.files[0]) this.app.handleLoad(e.target.files[0]); });

        document.getElementById('btn-popover-save').addEventListener('click', () => this.app.savePopoverHP());
        document.getElementById('btn-popover-roll').addEventListener('click', () => {
            document.getElementById('popover-hp-input').value = Math.floor(Math.random() * 5) + 2; 
        });
        document.getElementById('btn-popover-delete').addEventListener('click', () => this.app.deletePopoverToken());
    }

    switchSystemMode(mode) {
        this.app.appMode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));

        const isDesigner = (mode === 'designer');
        document.getElementById('design-tools-section').style.display = (mode === 'design') ? 'block' : 'none';
        document.getElementById('board-tools').style.display = isDesigner ? 'none' : 'block';
        document.getElementById('designer-sidebar').style.display = isDesigner ? 'block' : 'none';
        document.getElementById('play-sidebar').style.display = (mode === 'play') ? 'block' : 'none';
        document.getElementById('designer-view').style.display = isDesigner ? 'flex' : 'none';
        document.getElementById('boardCanvas').style.display = isDesigner ? 'none' : 'block';

        if (this.app.play) { if (mode === 'play') this.app.play.activate(); else this.app.play.deactivate(); }

        if (mode === 'play') {
            document.getElementById('btn-mode-play').classList.add('active');
            this.setActiveTool('pan');
        } else if (mode === 'design') {
            document.getElementById('btn-mode-design').classList.add('active');
            this.setActiveTool('wall-edge');
        } else {
            document.getElementById('btn-mode-designer').classList.add('active');
            if (this.app.designer) this.app.designer.activate();
        }
        this.app.hideHPPopover();
        this.app.renderer.draw();
    }

    renderTemplatesShelf() {
        const shelf = document.getElementById('local-templates-shelf');
        shelf.innerHTML = '';
        const templates = JSON.parse(localStorage.getItem('board_editor_templates') || '{}');
        
        Object.keys(templates).forEach(name => {
            const row = document.createElement('div');
            row.className = 'template-item-row';

            const selectBtn = document.createElement('button');
            selectBtn.className = 'template-select-btn';
            selectBtn.innerText = name;
            selectBtn.addEventListener('click', () => this.app.selectTemplate(name));

            const delBtn = document.createElement('button');
            delBtn.className = 'template-del-btn';
            delBtn.innerHTML = '✕';
            delBtn.title = 'Delete Template';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Delete template "${name}" permanently?`)) {
                    this.app.deleteTemplate(name);
                    this.renderTemplatesShelf();
                }
            });

            row.appendChild(selectBtn);
            row.appendChild(delBtn);
            shelf.appendChild(row);
        });
    }

    clearPaletteSelection() {
        document.querySelectorAll('.palette-item.selected').forEach(el => el.classList.remove('selected'));
    }

    setActiveTool(toolName) {
        this.app.currentTool = toolName;
        document.querySelectorAll('.control-group button').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`tool-${toolName}`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    updateGridInputs(cols, rows) {
        document.getElementById('grid-cols').value = cols;
        document.getElementById('grid-rows').value = rows;
    }
}