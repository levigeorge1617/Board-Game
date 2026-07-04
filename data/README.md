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
  "stats": {                    // die sizes; art in dice/dN.png
    "a1": 4,                    // action die 1 (primary, ☼)
    "a2": null,                 // action die 2 (optional) — only Enchantress & Cleric
    "m1": 12,                   // movement die 1 (primary, ֍)
    "m2": null,                 // movement die 2 (optional)
    "ba": 4,                    // bonus action die
    "bm": 6                     // bonus movement die
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
  "stats": { "monsterDie": 6, "movementDie": null },  // The Fog's movementDie is 20 (D20)
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
`guidebook.txt` and confirmed against each character's rules text.

**Hero dice columns** (0-indexed): `a1`=0, `a2`=1, `BA`=4, `BM`=5, `M2`=8, `M1`=9.
Note `M1` (col 9, the primary/universal movement die) comes *after* `M2` (col 8,
the optional second). There is **no "life" or "special" column** — earlier drafts
mislabelled col 9 as life; it is the movement die. Cross-checks that confirm it:
Cleric's two dice (6/8) appear as both its action dice *and* movement dice
("Both Dice count towards actions OR Movements"); Thief & Ranger get `M1`=d10
("D10 can move diagonally"); The Fog's `movementDie`=d20 ("moves with a D20").

Please still confirm these art guesses:

- **Monster art for Wyht & Oblex** — art was matched to monsters by element.
  Fire→bad5, Claw→bad2, Smoke→bad4 are confident. Mind (Wyht)→`bad1` and
  Flesh (Oblex)→`bad3` are a best guess between the two remaining images; swap
  them in the Designer if reversed.
- **Card art** — matched to `cards/*.png` by name where obvious; some cards
  (e.g. Counter Spell, Boots2/4/6 color order) are best-effort. Reassign in the
  Designer's Art field as needed.
- Druid transformation art (`players/druid1-4.jpg`, likely Turtle/Cheetah/Bear/Deer)
  is not yet wired to any field — a candidate for a future "hero forms" schema.
