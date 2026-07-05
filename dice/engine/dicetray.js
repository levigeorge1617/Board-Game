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
function colordataFor(key) {
    const bg = CATEGORY_COLOR[key] || CATEGORY_COLOR.action;
    return {
        id: 'bg_' + key, name: 'bg_' + key,
        foreground: isLight(bg) ? '#1a1206' : '#ffffff', background: bg, outline: '#00000066', edge: bg, texture: PLAIN_TEX,
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
    roll(specs, colorKey, onDone) {
        let b;
        try { b = ensureBox(); } catch (e) { console.warn('DiceTray', e); }
        if (!b || !specs || !specs.length) { if (onDone) onDone(); return; }
        try { b.clearDice(); } catch (e) {}
        try { factory.applyColorSet(colordataFor(colorKey)); } catch (e) {}

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
};
