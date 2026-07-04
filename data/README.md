# Game data

Structured, schema'd data for the game's heroes, monsters and cards. These files
are the **source of truth**. The board app reads them through `js/gamedata.js`, an
auto-generated embedded copy that lets `index.html` run when opened directly
(`file://`, no server).

## Files

| File | Contents |
|------|----------|
| `heroes.json`   | 10 heroes (5 colors × 2 characters, one reversible card per color) |
| `monsters.json` | 5 monsters (one is randomly assigned to the monster player) |
| `cards.json`    | 24 deck cards across the White (hero) and Black (monster) decks |

## Editing

Use the **🎴 Designer** tab in the app (open `index.html`). It edits a working copy
in your browser (`localStorage`), then **Export** downloads the JSON to drop back
in this folder. After editing the JSON, regenerate the embedded copy:

```
python3 tools/convert.py    # rebuilds data/*.json AND js/gamedata.js from the CSVs
```

> `tools/convert.py` currently regenerates from the original CSVs. Once you author
> primarily through the Designer, switch it (or add a sibling script) to read
> `data/*.json` and emit only `js/gamedata.js`.

## Symbol legend

| Symbol | Meaning |
|--------|---------|
| ☼ | Action die — actions **or** movement (revive, collect objective, attack, cast, enter/leave building) |
| ֍ | Movement die — movement only |
| ◆ | Objective-die ability, repeatable each turn once the objective-count threshold is met |
| ◇ | Objective-die ability, one-time trigger at its threshold |

## Schema

### heroes.json
```jsonc
{
  "id": "paladin",              // slug
  "name": "Paladin",
  "color": "RED",               // RED | YELLOW | GREEN | BLUE | PURPLE
  "pair": "red",                // the two heroes sharing this value are one reversible card
  "cardFace": "front",          // front | back  (front = the CSV's flagged default face)
  "art": "players/red2.jpg",
  "stats": {
    "actionDie": 4,             // D4  (☼)
    "movementDie": 6,           // D6  (֍)
    "life": 12,                 // max life
    "bonusDice": [4],           // bonus die faces (some heroes have two)
    "specialDie": null          // ⚠ unconfirmed 4th CSV column — verify in the Designer
  },
  "abilities": "…",             // \n-separated ability lines
  "objectiveAbilities": "…",    // \n-separated ◆/◇ lines
  "raw": ["…"]                  // original CSV row, preserved for reference
}
```

### monsters.json
```jsonc
{
  "id": "maraurnzol",
  "name": "Maraurn'Zol",
  "element": "Fire",            // Fire | Mind | Claw | Smoke | Flesh
  "art": "players/bad5.jpg",
  "stats": { "monsterDie": 6, "actionDie": null, "movementDie": null, "specialDie": null },
  "abilities": "…",
  "objectiveAbilities": "…",
  "raw": ["…"]
}
```

### cards.json
```jsonc
{
  "id": 268,
  "name": "Surprise Attack",
  "deck": "Black",              // White = hero deck, Black = monster deck
  "side": "monster",            // hero | monster (mirrors deck)
  "timing": "draw",             // draw | hand
  "copies": 10,                 // number of copies in the deck
  "cost": "0",                  // e.g. 0, 3☼, X☼, 1֍
  "art": "cards/surprise.png",
  "text": "…",
  "raw": ["…"]
}
```

## Provenance & flagged assumptions

Converted from the original headerless spreadsheets `cards_heros.csv` and
`cards_decks.csv` by `tools/convert.py`. Column meanings were inferred against
`guidebook.txt`; the confident mappings (names, colors, action/movement dice,
life, ability text, deck/cost) are reliable. Please confirm these guesses:

- **`stats.specialDie`** (heroes) — a CSV column whose meaning wasn't certain
  (Wizard 4, Thief 4, Ranger 8, Cleric 6). Left as-is; confirm or clear per hero.
- **Monster art for Wyht & Oblex** — art was matched to monsters by element.
  Fire→bad5, Claw→bad2, Smoke→bad4 are confident. Mind (Wyht)→`bad1` and
  Flesh (Oblex)→`bad3` are a best guess between the two remaining images; swap
  them in the Designer if reversed.
- **Card art** — matched to `cards/*.png` by name where obvious; some cards
  (e.g. Counter Spell, Boots2/4/6 color order) are best-effort. Reassign in the
  Designer's Art field as needed.
- Druid transformation art (`players/druid1-4.jpg`, likely Turtle/Cheetah/Bear/Deer)
  is not yet wired to any field — a candidate for a future "hero forms" schema.
