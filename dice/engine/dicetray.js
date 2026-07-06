/*
 * dicetray.js — bridges the vendored 3DDiceRoller engine (public domain / Unlicense,
 * MajorVictory/3DDiceRoller) into this game as a small contained tray.
 *
 * Our roll RESULTS are decided authoritatively in the reducer and synced, so we
 * force the dice onto those values (notationVectors.result) instead of letting
 * physics pick — every device shows the same numbers. Exposes window.DiceTray.
 */
"use strict";
import { DiceBox } from './DiceBox.js';
import { DiceFactory } from './DiceFactory.js';
import { DiceColors, COLORSETS } from './DiceColors.js';
import { DiceFunctions } from './DiceFunctions.js';
import { DicePreset } from './DicePreset.js';
import { Teal } from './Teal.js';

// --- minimal globals the engine expects (it was written for a full app) ---
new Teal();                                   // sets window.Teal
const favStub = {
    settings: {
        volume: { value: '0' }, sounds: { value: '0' }, shadows: { value: '1' },
        tally: { value: '0' }, surface: { value: 'felt' }, allowDiceOverride: { value: '0' },
    },
    retrieve() {}, ensureOnScreen() {},
};
window.DiceFavorites = favStub;
const factory = new DiceFactory();
window.DiceFactory = factory;                 // DiceNotation uses window.DiceFactory directly

// Custom combat die: a d6 with 3 skull, 2 shield, 1 blank face (values 1-3 skull,
// 4-5 shield, 6 blank so results can be forced to specific faces).
try {
    const combat = new DicePreset('dcombat', 'd6');
    combat.name = 'Combat';
    combat.setLabels(['☠', '☠', '☠', '⛨', '⛨', '']);
    combat.setValues(1, 6);
    combat.display = 'labels';
    combat.system = 'boardgame';
    factory.register(combat);
} catch (e) { console.warn('combat die register failed', e); }
window.DiceRoller = { DiceFactory: factory, DiceFavorites: favStub, Teal: window.Teal };
const colors = new DiceColors();
window.DiceColors = colors;

// --- plain (textureless) color sets for our dice categories / seat colors ---
const CATEGORY_COLOR = {
    action: '#f2b032', movement: '#46c6a6', bonus: '#c98bff', objective: '#37c0dd',
    monster: '#b02a2a', RED: '#ff3333', YELLOW: '#ffd21f', GREEN: '#33cc44', BLUE: '#3366ff', PURPLE: '#9933ff',
};
const isLight = hex => {
    const c = hex.replace('#', ''); const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};
// A resolved "none" texture object (the factory expects an object, not the string).
const PLAIN_TEX = { name: 'none', texture: '', composite: 'source-over', bump: '', data: {}, material: 'plastic' };
function hexFor(key) { return CATEGORY_COLOR[key] || CATEGORY_COLOR.action; }
function colordataFor(key) {
    const bg = hexFor(key);
    return {
        id: 'bg_' + key, name: 'bg_' + key,
        foreground: isLight(bg) ? '#1a1206' : '#ffffff', background: bg, outline: '#00000066', edge: bg, texture: PLAIN_TEX,
    };
}
// "Special" marbled look for bonus dice: the hero color with a bright gold rim/outline
// so unlocked bonus dice read as distinct from ordinary action/move dice.
function colordataMarble(key) {
    const bg = hexFor(key);
    return {
        id: 'mrb_' + key, name: 'mrb_' + key,
        foreground: '#fff6d8', background: bg, outline: '#e0a800', edge: '#ffcf4d', texture: PLAIN_TEX,
    };
}
// Two-color set (attacker vs defender). The engine picks per-die from the array,
// so both sides' colors appear in one combat roll instead of all one color.
function colordataPair(keyA, keyB) {
    const a = hexFor(keyA), b = hexFor(keyB);
    return {
        id: 'pair_' + keyA + '_' + keyB, name: 'pair',
        foreground: ['#ffffff', '#ffffff'], background: [a, b], outline: ['#00000066', '#00000066'], edge: [a, b],
        texture: [PLAIN_TEX, PLAIN_TEX],
    };
}

let box = null;
function ensureBox() {
    if (box) return box;
    const container = document.getElementById('ph-tray');
    if (!container || !container.clientWidth) return null;
    box = new DiceBox(container, { w: container.clientWidth, h: container.clientHeight });
    box.selector.dice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
    box.initialize();
    window.DiceFunctions = new DiceFunctions(box);   // DiceBox reads window.DiceFunctions.rethrowFunctions
    window.DiceRoller.DiceRoom = { DiceBox: box };   // eventCollide() reads this (sounds off, just resolves)
    window.DiceTray._box = box;
    return box;
}

window.DiceTray = {
    ready: () => !!box,
    init() { try { ensureBox(); } catch (e) { console.warn('DiceTray init failed', e); } },
    resize() {
        const c = document.getElementById('ph-tray');
        if (box && c && c.clientWidth) box.setDimensions({ w: c.clientWidth, h: c.clientHeight });
    },
    // specs: [{type:'d20', value:14}, ...]  colorKey: category or seat color name
    // opts.marble → render as the "special" bonus-die look (hero color + gold rim).
    roll(specs, colorKey, onDone, opts) {
        let b;
        try { b = ensureBox(); } catch (e) { console.warn('DiceTray', e); }
        if (!b || !specs || !specs.length) { if (onDone) onDone(); return; }
        try { b.clearDice(); } catch (e) {}
        try { factory.applyColorSet((opts && opts.marble) ? colordataMarble(colorKey) : colordataFor(colorKey)); } catch (e) {}

        const counts = {}; specs.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
        const notation = Object.entries(counts).map(([t, n]) => `${n}${t}`).join('+');
        const values = specs.map(s => s.value);

        const w = b.display.currentWidth, h = b.display.currentHeight;
        const vector = { x: (Math.random() * 2 - 0.5) * w, y: -(Math.random() * 2 - 0.5) * h };
        const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const boost = (Math.random() + 3) * dist;

        try {
            const nv = b.getNotationVectors(notation, vector, boost, dist);
            nv.result = values;
            b.rolling = true;
            b.rollDice(nv, () => { b.rolling = false; if (onDone) onDone(); });
        } catch (e) { console.warn('DiceTray roll failed', e); if (onDone) onDone(); }
    },
    // atkFaces/defFaces: arrays of combat-die values (1-3 skull, 4-5 shield, 6 blank).
    // Attacker dice are colored atkKey, defender dice defKey so you can tell whose is whose.
    rollCombat(atkFaces, defFaces, atkKey, defKey, onDone) {
        let b; try { b = ensureBox(); } catch (e) {}
        const faces = (atkFaces || []).concat(defFaces || []);
        if (!b || !faces.length) { if (onDone) onDone(); return; }
        try { b.clearDice(); } catch (e) {}
        try { factory.applyColorSet(colordataPair(atkKey || 'monster', defKey || 'monster')); } catch (e) {}
        const w = b.display.currentWidth, h = b.display.currentHeight;
        const vector = { x: (Math.random() * 2 - 0.5) * w, y: -(Math.random() * 2 - 0.5) * h };
        const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const boost = (Math.random() + 3) * dist;
        try {
            const nv = b.getNotationVectors(faces.length + 'dcombat', vector, boost, dist);
            nv.result = faces.slice();
            b.rolling = true;
            b.rollDice(nv, () => { b.rolling = false; if (onDone) onDone(); });
        } catch (e) { console.warn('DiceTray rollCombat failed', e); if (onDone) onDone(); }
    },
};
