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
    monster: '#5c1020', RED: '#ff3333', YELLOW: '#ffd21f', GREEN: '#33cc44', BLUE: '#3366ff', PURPLE: '#9933ff',
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
// Blend two #rrggbb colors (t=0 → a, t=1 → b).
function mixHex(a, b, t) {
    const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
    const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
    return '#' + c(ar, br) + c(ag, bg) + c(ab, bb);
}
// "Special" marbled look for bonus dice: the hero color BLENDED toward gold with a
// bright gold rim, so a bonus die is a strictly distinct single color from the
// plain hero-colored action/move dice while still reading as that hero's die.
function colordataMarble(key) {
    const bg = mixHex(hexFor(key), '#e0a800', 0.5);
    return {
        id: 'mrb_' + key, name: 'mrb_' + key,
        foreground: '#20160a', background: bg, outline: '#7a5600', edge: '#ffd24d', texture: PLAIN_TEX,
    };
}
// Build the solid/marble colordata for one die spec.
function colordataOf(spec) { return spec.marble ? colordataMarble(spec.colorKey) : colordataFor(spec.colorKey); }

// --- STRICT per-die coloring ------------------------------------------------
// The engine colors each die in create() → setMaterialInfo(), once per die in the
// order dice are spawned. We wrap setMaterialInfo to pull from a queue we set just
// before rolling, so die N gets exactly colordata N (its owner's / category's
// color) instead of a random pick from a color array.
const _origSetMaterialInfo = factory.setMaterialInfo.bind(factory);
factory.setMaterialInfo = function (colorset) {
    const q = factory.__perDie;
    if (q && q.length) {
        const cd = q[(factory.__perDieIdx = (factory.__perDieIdx || 0)) % q.length];
        factory.__perDieIdx++;
        factory.__lastCd = cd;         // remembered so we can retag the mesh + re-apply on face-swap
        this.applyColorSet(cd);        // make this die's solid color the current set
        return _origSetMaterialInfo('');
    }
    return _origSetMaterialInfo(colorset);
};
// Compute the factory's *_rand color fields from one solid colordata WITHOUT touching
// the per-die queue (used to restore a die's own color before a d4 face-swap).
function applySolidColor(cd) {
    const q = factory.__perDie; factory.__perDie = null;
    try { factory.applyColorSet(cd); _origSetMaterialInfo(''); } finally { factory.__perDie = q; }
}
// Tag every created mesh with the colordata it was built from.
const _origCreate = factory.create.bind(factory);
factory.create = function (type) {
    const mesh = _origCreate(type);
    if (mesh && factory.__lastCd) mesh.__cd = factory.__lastCd;
    return mesh;
};

let box = null;
function ensureBox() {
    if (box) return box;
    const container = document.getElementById('ph-tray');
    if (!container || !container.clientWidth) return null;
    box = new DiceBox(container, { w: container.clientWidth, h: container.clientHeight });
    box.selector.dice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
    box.initialize();
    // Forcing a d4's result rebuilds its materials from ambient factory state, which
    // would recolor it to the last-spawned die's color. Restore this die's own color first.
    const _origSwap = box.swapDiceFace.bind(box);
    box.swapDiceFace = function (dicemesh, result) {
        if (dicemesh && dicemesh.__cd) applySolidColor(dicemesh.__cd);
        return _origSwap(dicemesh, result);
    };
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
    // Core roller. specs: [{ type:'d20', value:14, colorKey:'RED', marble:false }, ...]
    // Each die is its own notation term so forced values AND per-die colors line up
    // one-to-one with the spawn order — no grouping, no random color picks.
    _rollSpecs(specs, onDone) {
        let b;
        try { b = ensureBox(); } catch (e) { console.warn('DiceTray', e); }
        if (!b || !specs || !specs.length) { if (onDone) onDone(); return; }
        try { b.clearDice(); } catch (e) {}

        const notation = specs.map(s => '1' + s.type).join('+');
        const values = specs.map(s => s.value);
        factory.__perDie = specs.map(colordataOf);   // consumed in create() order
        factory.__perDieIdx = 0;
        try { factory.applyColorSet(factory.__perDie[0]); } catch (e) {}

        const w = b.display.currentWidth, h = b.display.currentHeight;
        const vector = { x: (Math.random() * 2 - 0.5) * w, y: -(Math.random() * 2 - 0.5) * h };
        const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const boost = (Math.random() + 3) * dist;
        const clearQueue = () => { factory.__perDie = null; factory.__perDieIdx = 0; };
        try {
            const nv = b.getNotationVectors(notation, vector, boost, dist);
            nv.result = values;
            b.rolling = true;
            b.rollDice(nv, () => { b.rolling = false; clearQueue(); if (onDone) onDone(); });
        } catch (e) { console.warn('DiceTray roll failed', e); clearQueue(); if (onDone) onDone(); }
    },
    // specs: [{type:'d20', value:14, key?}, ...]; colorKey = default hero/category color.
    // opts.marble marks the WHOLE roll special; per-spec `marble` overrides per die
    // (so bonus dice can be marbled while their action/move mates stay solid).
    roll(specs, colorKey, onDone, opts) {
        const list = (specs || []).map(s => ({
            type: s.type, value: s.value,
            colorKey: s.colorKey || colorKey,
            marble: s.marble != null ? s.marble : !!(opts && opts.marble),
        }));
        this._rollSpecs(list, onDone);
    },
    // atkFaces/defFaces: combat-die values (1-3 skull, 4-5 shield, 6 blank). Attacker
    // dice render in atkKey's color, defender dice in defKey's — a strict split.
    rollCombat(atkFaces, defFaces, atkKey, defKey, onDone) {
        const list = (atkFaces || []).map(v => ({ type: 'dcombat', value: v, colorKey: atkKey || 'monster' }))
            .concat((defFaces || []).map(v => ({ type: 'dcombat', value: v, colorKey: defKey || 'monster' })));
        this._rollSpecs(list, onDone);
    },
};
