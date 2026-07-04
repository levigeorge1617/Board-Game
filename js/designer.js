/*
 * Designer: in-app editor for heroes, monsters and cards.
 * Data source of truth is data/*.json, embedded as window.GAME_DATA (js/gamedata.js).
 * Edits live in localStorage; Export downloads JSON to commit back to data/.
 */
const DZ_STORE_KEY = 'board_designer_data';

// Declarative field schema drives the editor form for each entity type.
const DZ_FIELDS = {
    heroes: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'color', label: 'Color', type: 'select', options: ['RED', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'] },
        { key: 'cardFace', label: 'Card face', type: 'select', options: ['front', 'back'],
          hint: 'Two heroes share one reversible card (same color).' },
        { key: 'pair', label: 'Reversible pair', type: 'text', hint: 'Heroes with the same value are two sides of one card.' },
        { key: 'art', label: 'Art', type: 'art' },
        { key: 'stats.actionDie', label: 'Action die  ☼ (D_)', type: 'number' },
        { key: 'stats.movementDie', label: 'Movement die  ֍ (D_)', type: 'number' },
        { key: 'stats.life', label: 'Max life', type: 'number' },
        { key: 'stats.bonusDice', label: 'Bonus dice (comma list)', type: 'numlist' },
        { key: 'stats.specialDie', label: 'Special die (unconfirmed)', type: 'number',
          hint: 'Original CSV column of uncertain meaning — confirm or clear.' },
        { key: 'abilities', label: 'Abilities', type: 'textarea' },
        { key: 'objectiveAbilities', label: 'Objective-die abilities  ◆/◇', type: 'textarea' },
    ],
    monsters: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'element', label: 'Element', type: 'text' },
        { key: 'art', label: 'Art', type: 'art' },
        { key: 'stats.monsterDie', label: 'Monster die (D_)', type: 'number' },
        { key: 'stats.actionDie', label: 'Action die  ☼ (D_)', type: 'number' },
        { key: 'stats.movementDie', label: 'Movement die  ֍ (D_)', type: 'number' },
        { key: 'stats.specialDie', label: 'Special die (e.g. D20)', type: 'number' },
        { key: 'abilities', label: 'Abilities', type: 'textarea' },
        { key: 'objectiveAbilities', label: 'Objective-die abilities  ◆/◇', type: 'textarea' },
    ],
    cards: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'deck', label: 'Deck', type: 'select', options: ['White', 'Black'],
          hint: 'White = hero deck, Black = monster deck.' },
        { key: 'timing', label: 'Timing', type: 'select', options: ['draw', 'hand'] },
        { key: 'cost', label: 'Cost', type: 'text', hint: 'e.g. 0, 3☼, X☼, 1֍' },
        { key: 'copies', label: 'Copies in deck', type: 'number' },
        { key: 'art', label: 'Art', type: 'art' },
        { key: 'text', label: 'Card text', type: 'textarea' },
    ],
};

const DZ_COLOR_HEX = { RED: '#ff3333', YELLOW: '#ffd21f', GREEN: '#33cc44', BLUE: '#3366ff', PURPLE: '#9933ff' };

class Designer {
    constructor(app) {
        this.app = app;
        this.data = this.loadData();
        this.type = 'heroes';
        this.selected = 0;
        this.filter = '';
        this.built = false;
    }

    // ---- data -------------------------------------------------------------
    defaults() {
        const g = window.GAME_DATA || { heroes: [], monsters: [], cards: [] };
        return JSON.parse(JSON.stringify(g));
    }
    loadData() {
        try {
            const raw = localStorage.getItem(DZ_STORE_KEY);
            if (raw) {
                const d = JSON.parse(raw);
                if (d && d.heroes && d.monsters && d.cards) return d;
            }
        } catch (e) { /* fall through to defaults */ }
        return this.defaults();
    }
    save() {
        try { localStorage.setItem(DZ_STORE_KEY, JSON.stringify(this.data)); }
        catch (e) { console.warn('Designer save failed', e); }
    }
    list() { return this.data[this.type] || []; }
    current() { return this.list()[this.selected]; }

    // nested get/set for keys like "stats.actionDie"
    getVal(obj, key) { return key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
    setVal(obj, key, val) {
        const parts = key.split('.');
        let o = obj;
        for (let i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null) o[parts[i]] = {}; o = o[parts[i]]; }
        o[parts[parts.length - 1]] = val;
    }

    // ---- lifecycle --------------------------------------------------------
    activate() {
        if (!this.built) { this.wire(); this.built = true; }
        this.render();
    }

    wire() {
        document.querySelectorAll('.dz-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.dz-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.type = tab.dataset.type;
                this.selected = 0;
                this.render();
            });
        });
        const search = document.getElementById('dz-search');
        search.addEventListener('input', () => { this.filter = search.value.toLowerCase(); this.renderList(); });

        document.getElementById('dz-add').addEventListener('click', () => this.addEntity());
        document.getElementById('dz-export-heroes').addEventListener('click', () => this.exportFile('heroes'));
        document.getElementById('dz-export-monsters').addEventListener('click', () => this.exportFile('monsters'));
        document.getElementById('dz-export-cards').addEventListener('click', () => this.exportFile('cards'));
        document.getElementById('dz-import').addEventListener('click', () => document.getElementById('dz-file-input').click());
        document.getElementById('dz-file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) this.importFile(e.target.files[0]);
            e.target.value = '';
        });
        document.getElementById('dz-reset').addEventListener('click', () => {
            if (confirm('Discard your local edits and reload the data shipped in the repo?')) {
                localStorage.removeItem(DZ_STORE_KEY);
                this.data = this.defaults();
                this.selected = 0;
                this.render();
            }
        });
    }

    render() { this.renderList(); this.renderEditor(); this.renderPreview(); }

    // ---- list -------------------------------------------------------------
    renderList() {
        const wrap = document.getElementById('dz-list');
        wrap.innerHTML = '';
        const items = this.list();
        items.forEach((item, idx) => {
            if (this.filter && !(item.name || '').toLowerCase().includes(this.filter)) return;
            const row = document.createElement('div');
            row.className = 'dz-list-item' + (idx === this.selected ? ' active' : '');
            const swatch = this.swatchColor(item);
            row.innerHTML =
                `<span class="dz-dot" style="background:${swatch}"></span>` +
                `<span class="dz-list-name">${this.esc(item.name || '(unnamed)')}</span>` +
                `<span class="dz-list-tag">${this.esc(this.subtitle(item))}</span>`;
            row.addEventListener('click', () => { this.selected = idx; this.render(); });
            wrap.appendChild(row);
        });
        if (!wrap.children.length) wrap.innerHTML = '<div class="dz-empty">No matches.</div>';
    }
    swatchColor(item) {
        if (this.type === 'heroes') return DZ_COLOR_HEX[item.color] || '#888';
        if (this.type === 'cards') return item.deck === 'Black' ? '#222' : '#e8e8e8';
        return '#8a5a2b';
    }
    subtitle(item) {
        if (this.type === 'heroes') return item.cardFace || '';
        if (this.type === 'monsters') return item.element || '';
        return item.cost && item.cost !== '0' ? item.cost : '';
    }

    // ---- editor -----------------------------------------------------------
    renderEditor() {
        const wrap = document.getElementById('dz-editor');
        const item = this.current();
        if (!item) { wrap.innerHTML = '<div class="dz-empty">Select or add an entry.</div>'; return; }
        wrap.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'dz-editor-head';
        header.innerHTML = `<h3>Edit ${this.type.slice(0, -1)}</h3>`;
        const del = document.createElement('button');
        del.className = 'dz-del-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', () => this.deleteEntity());
        header.appendChild(del);
        wrap.appendChild(header);

        DZ_FIELDS[this.type].forEach(field => wrap.appendChild(this.fieldRow(field, item)));
    }

    fieldRow(field, item) {
        const row = document.createElement('div');
        row.className = 'dz-field';
        const label = document.createElement('label');
        label.textContent = field.label;
        row.appendChild(label);

        let input;
        const val = this.getVal(item, field.key);

        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.value = val == null ? '' : val;
            input.rows = Math.min(12, Math.max(3, String(val || '').split('\n').length + 1));
        } else if (field.type === 'select') {
            input = document.createElement('select');
            field.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (opt === val) o.selected = true;
                input.appendChild(o);
            });
        } else if (field.type === 'art') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = val == null ? '' : val;
            input.placeholder = 'players/… or cards/…';
        } else if (field.type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.value = (val == null) ? '' : val;
        } else if (field.type === 'numlist') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = Array.isArray(val) ? val.join(', ') : '';
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = val == null ? '' : val;
        }

        input.className = 'dz-input';
        const commit = () => this.commitField(field, item, input.value);
        input.addEventListener('input', commit);
        input.addEventListener('change', commit);
        row.appendChild(input);

        if (field.hint) {
            const hint = document.createElement('div');
            hint.className = 'dz-hint';
            hint.textContent = field.hint;
            row.appendChild(hint);
        }
        return row;
    }

    commitField(field, item, raw) {
        let value = raw;
        if (field.type === 'number') value = raw === '' ? null : Number(raw);
        else if (field.type === 'numlist') value = raw.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n);
        this.setVal(item, field.key, value);
        this.save();
        // light-touch refreshes: keep the list label + preview in sync without losing focus
        if (field.key === 'name' || field.key === 'color' || field.key === 'deck' ||
            field.key === 'element' || field.key === 'cardFace' || field.key === 'cost') this.renderList();
        this.renderPreview();
    }

    // ---- preview ----------------------------------------------------------
    renderPreview() {
        const wrap = document.getElementById('dz-preview');
        const item = this.current();
        if (!item) { wrap.innerHTML = ''; return; }

        if (this.type === 'cards') { wrap.innerHTML = this.cardPreview(item); return; }

        const accent = this.type === 'heroes' ? (DZ_COLOR_HEX[item.color] || '#888') : '#b5462b';
        const s = item.stats || {};
        const dice = this.type === 'heroes'
            ? [['Action ☼', s.actionDie], ['Move ֍', s.movementDie], ['Life', s.life],
               ['Bonus', (s.bonusDice || []).join(' / ') || '—']]
            : [['Monster', s.monsterDie], ['Action ☼', s.actionDie], ['Move ֍', s.movementDie], ['Special', s.specialDie]];
        const stats = dice.map(([k, v]) =>
            `<div class="dz-stat"><span>${k}</span><b>${v == null || v === '' ? '—' : v}</b></div>`).join('');

        wrap.innerHTML =
            `<div class="dz-card" style="--accent:${accent}">` +
                `<div class="dz-card-art">${this.artTag(item.art)}</div>` +
                `<div class="dz-card-title">${this.esc(item.name || '')}` +
                    `<span>${this.esc(item.color || item.element || '')}</span></div>` +
                `<div class="dz-stats">${stats}</div>` +
                (item.abilities ? `<div class="dz-block"><h4>Abilities</h4><p>${this.nl(item.abilities)}</p></div>` : '') +
                (item.objectiveAbilities ? `<div class="dz-block"><h4>Objective ◆/◇</h4><p>${this.nl(item.objectiveAbilities)}</p></div>` : '') +
            `</div>`;
    }

    cardPreview(item) {
        const dark = item.deck === 'Black';
        return `<div class="dz-card dz-playcard ${dark ? 'dz-black' : 'dz-white'}">` +
            `<div class="dz-pc-head"><span class="dz-pc-cost">${this.esc(item.cost || '0')}</span>` +
            `<span class="dz-pc-deck">${this.esc(item.deck)} · ${this.esc(item.timing || '')}</span></div>` +
            `<div class="dz-card-art">${this.artTag(item.art)}</div>` +
            `<div class="dz-card-title">${this.esc(item.name || '')}<span>×${item.copies || 1}</span></div>` +
            `<div class="dz-block"><p>${this.nl(item.text || '')}</p></div>` +
        `</div>`;
    }

    artTag(src) {
        if (!src) return '<div class="dz-noart">no art</div>';
        return `<img src="${this.esc(src)}" alt="" onerror="this.parentNode.innerHTML='<div class=&quot;dz-noart&quot;>missing: ${this.esc(src)}</div>'">`;
    }

    // ---- add / delete -----------------------------------------------------
    addEntity() {
        const blank = { heroes: { name: 'New Hero', color: 'RED', cardFace: 'front', art: '', stats: { bonusDice: [] }, abilities: '', objectiveAbilities: '' },
                        monsters: { name: 'New Monster', element: '', art: '', stats: {}, abilities: '', objectiveAbilities: '' },
                        cards: { name: 'New Card', deck: 'White', side: 'hero', timing: 'draw', cost: '0', copies: 1, art: '', text: '' } }[this.type];
        blank.id = this.slug(blank.name) + '-' + Date.now();
        this.list().push(blank);
        this.selected = this.list().length - 1;
        this.save();
        this.render();
    }
    deleteEntity() {
        const item = this.current();
        if (!item) return;
        if (!confirm(`Delete "${item.name}"?`)) return;
        this.list().splice(this.selected, 1);
        this.selected = Math.max(0, this.selected - 1);
        this.save();
        this.render();
    }

    // ---- import / export --------------------------------------------------
    exportFile(type) {
        // keep card side in sync with deck on export
        if (type === 'cards') this.data.cards.forEach(c => c.side = c.deck === 'Black' ? 'monster' : 'hero');
        const blob = JSON.stringify(this.data[type], null, 2);
        const a = document.createElement('a');
        a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(blob);
        a.download = type + '.json';
        document.body.appendChild(a); a.click(); a.remove();
    }
    importFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                const arr = Array.isArray(parsed) ? parsed : parsed[this.type];
                if (!Array.isArray(arr)) throw new Error('Expected a JSON array of ' + this.type);
                this.data[this.type] = arr;
                this.selected = 0;
                this.save();
                this.render();
            } catch (err) { alert('Import failed: ' + err.message); }
        };
        reader.readAsText(file);
    }

    // ---- helpers ----------------------------------------------------------
    slug(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    nl(s) { return this.esc(s).replace(/\n/g, '<br>'); }
}
