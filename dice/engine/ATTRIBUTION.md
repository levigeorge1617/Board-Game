# Vendored 3D dice engine

The files in this folder (DiceBox, DiceFactory, DiceColors, DiceFavorites,
DiceFunctions, DiceNotation, DicePreset, Teal) plus `three.min.js` and
`cannon.js` are vendored from **MajorVictory/3DDiceRoller**
(https://github.com/MajorVictory/3DDiceRoller), released under **The Unlicense**
(public domain).

Small local patches (marked "patched for board-game"):
- DiceBox.js: only preload sound assets when sound is enabled (avoids 404s).
- DiceFactory.js: coin die uses text labels instead of external textures.

`dicetray.js` is our own bridge: it wires the globals the engine expects, builds
a contained tray, and forces each die onto the result our synced reducer already
decided (so every device shows the same numbers).
