class UIManager {
    constructor(appController) {
        this.app = appController;
        this.initEventListeners();
        this.renderTemplatesShelf();
    }

    initEventListeners() {
        document.getElementById('btn-mode-play').addEventListener('click', () => this.switchSystemMode('play'));
        document.getElementById('btn-mode-design').addEventListener('click', () => this.switchSystemMode('design'));

        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
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
        document.getElementById('design-tools-section').style.display = (mode === 'design') ? 'block' : 'none';
        
        if (mode === 'play') {
            document.getElementById('btn-mode-play').classList.add('active');
            this.setActiveTool('pan');
        } else {
            document.getElementById('btn-mode-design').classList.add('active');
            this.setActiveTool('wall-edge');
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