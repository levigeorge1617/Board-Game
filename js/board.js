class BoardState {
    constructor(cols = 90, rows = 26) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = 40;
        this.tokens = [];
        this.edges = {};  
        this.floors = {}; 
        
        this.undoStack = [];
        this.redoStack = [];
    }

    resize(cols, rows) {
        this.saveHistory();
        this.cols = cols;
        this.rows = Math.min(26, rows); // Enforce grid matrix safety thresholds
    }

    getEdge(x, y) {
        if (!this.edges[`${x},${y}`]) this.edges[`${x},${y}`] = { top: 0, left: 0 };
        return this.edges[`${x},${y}`];
    }

    toggleEdgeStructure(x, y, type, mode) {
        this.saveHistory();
        const edge = this.getEdge(x, y);
        edge[type] = (edge[type] === mode) ? 0 : mode;
    }

    setFloor(x, y, value) {
        this.saveHistory();
        this.floors[`${x},${y}`] = value;
    }

    saveHistory() {
        this.undoStack.push(JSON.stringify({ cols: this.cols, rows: this.rows, tokens: this.tokens, edges: this.edges, floors: this.floors }));
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify({ cols: this.cols, rows: this.rows, tokens: this.tokens, edges: this.edges, floors: this.floors }));
        this.applySnapshot(this.undoStack.pop());
    }

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify({ cols: this.cols, rows: this.rows, tokens: this.tokens, edges: this.edges, floors: this.floors }));
        this.applySnapshot(this.redoStack.pop());
    }

    applySnapshot(jsonString) {
        const data = JSON.parse(jsonString);
        this.cols = data.cols;
        this.rows = data.rows;
        this.tokens = data.tokens || [];
        this.edges = data.edges || {};
        this.floors = data.floors || {};
    }
}