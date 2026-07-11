#!/usr/bin/env python3
"""Convert the headerless design CSVs into schema'd JSON for the designer tool.

LEGACY / ONE-SHOT IMPORTER. data/*.json is now the source of truth for the app
(hand-authored balance lives there — abilities, stats, combat). Running this
again re-imports the OLD CSVs and will overwrite those edits. To refresh the
embedded js/gamedata.js from the JSON without touching balance, run
tools/embed.py instead.
"""
import csv, json, os, re

ROOT = "/home/user/Board-Game"

def clean(s):
    # vertical tabs (0x0b) were used as in-cell line breaks; normalize to \n
    if s is None:
        return ""
    return s.replace("\x0b", "\n").strip()

def num(s):
    s = (s or "").strip()
    return int(s) if s.isdigit() else None

def slug(name):
    return re.sub(r"[^a-z0-9]+", "", name.lower())

# ---- Hero / monster art + pairing map -------------------------------------
HERO_ART = {
    "Paladin": "players/red2.jpg",   "Barbarian": "players/red1.jpg",
    "Hunter":  "players/yellow1.jpg", "Scout":    "players/yellow2.jpg",
    "Wizard":  "players/blue2.jpg",   "Enchantress":"players/blue1.jpg",
    "Thief":   "players/green1.jpg",  "Ranger":   "players/green2.jpg",
    "Druid":   "players/purple2.jpg", "Cleric":   "players/purple1.jpg",
}
# reversible-card pairing (each color = one physical double-sided card)
PAIR = {"RED":"red","YELLOW":"yellow","BLUE":"blue","GREEN":"green","PURPLE":"purple"}

MONSTER_ART = {   # linked by element; fungal/flesh pair (Wyht/Oblex) is a best guess
    "Maraurn'Zol": "players/bad5.jpg",  # Fire  (confident)
    "Ghathag":     "players/bad2.jpg",  # Claw  (confident)
    "The Fog":     "players/bad4.jpg",  # Smoke (confident)
    "Wyht, the Trickster": "players/bad1.jpg",  # Mind  (best guess)
    "Oblex":       "players/bad3.jpg",  # Flesh (best guess)
}

# ---- Convert heroes.csv ----------------------------------------------------
# ---- Combat stat block (HP / Attack dice / Defense dice / reach) ----------
# Starting numbers for the new attack/defense-pool combat (docs/combat-redesign.md).
# Tunable; HP also seeds each hero piece.
COMBAT = {
    "Paladin":     {"hp": 8, "attack": 2, "defense": 3, "reach": 1},
    "Barbarian":   {"hp": 8, "attack": 4, "defense": 2, "reach": 1},
    "Hunter":      {"hp": 6, "attack": 3, "defense": 1, "reach": 2},
    "Scout":       {"hp": 5, "attack": 2, "defense": 2, "reach": 1},
    "Wizard":      {"hp": 4, "attack": 1, "defense": 1, "reach": 1},
    "Enchantress": {"hp": 5, "attack": 1, "defense": 1, "reach": 1},
    "Thief":       {"hp": 5, "attack": 4, "defense": 1, "reach": 1},
    "Ranger":      {"hp": 6, "attack": 3, "defense": 2, "reach": 3},
    "Druid":       {"hp": 6, "attack": 2, "defense": 2, "reach": 1},
    "Cleric":      {"hp": 6, "attack": 1, "defense": 3, "reach": 1},
    # monsters have no HP (can't be killed — heroes repel them); attack/defense used for their strikes
    "Maraurn'Zol": {"attack": 5, "defense": 0, "reach": 1},
    "The Fog":     {"attack": 4, "defense": 0, "reach": 2},
    "Ghathag":     {"attack": 4, "defense": 2, "reach": 1},
    "Oblex":       {"attack": 2, "defense": 0, "reach": 1},
    "Wyht, the Trickster": {"attack": 2, "defense": 0, "reach": 1},
}

heroes, monsters = [], []
with open(os.path.join(ROOT, "cards_heros.csv")) as f:
    for row in csv.reader(f):
        if not row or len(row) < 12:
            continue
        name = clean(row[11])
        if not name:
            continue
        color = clean(row[6])
        entry = {
            "id": slug(name),
            "name": name,
            "abilities": clean(row[2]),
            "objectiveAbilities": clean(row[7]),
            "raw": [clean(c) for c in row],
        }
        # Dice columns (0-indexed): a1=0, a2=1, BA=4, BM=5, M2=8, M1=9.
        # M1 (col 9) is the primary/universal movement die; M2 (col 8) the optional
        # second one. a2 (col 1) is the optional second action die. There is no
        # separate "life" or "special" column — those earlier guesses were wrong.
        if color == "MONSTER":
            entry.update({
                "element": clean(row[10]),
                "art": MONSTER_ART.get(name, ""),
                "stats": {
                    "monsterDie": num(row[1]) or num(row[0]),   # black die rolled for actions (◆)
                    "movementDie": num(row[8]) or num(row[9]),  # e.g. The Fog's D20
                },
                "combat": COMBAT.get(name, {"attack": 3, "defense": 0, "reach": 1}),
            })
            monsters.append(entry)
        else:
            front = clean(row[3]) == "1"
            entry.update({
                "color": color,
                "pair": PAIR.get(color, color.lower()),
                "cardFace": "front" if front else "back",
                "art": HERO_ART.get(name, ""),
                "stats": {
                    "a1": num(row[0]),   # action die 1 (primary)
                    "a2": num(row[1]),   # action die 2 (optional)
                    "m1": num(row[9]),   # movement die 1 (primary)
                    "m2": num(row[8]),   # movement die 2 (optional)
                    "ba": num(row[4]),   # bonus action die
                    "bm": num(row[5]),   # bonus movement die
                    "life": COMBAT.get(name, {}).get("hp", 6),   # HP for the combat pool + piece
                },
                "combat": {k: v for k, v in COMBAT.get(name, {"attack": 2, "defense": 2, "reach": 1}).items() if k != "hp"},
            })
            heroes.append(entry)

# ---- Card art best-effort filename map ------------------------------------
CARD_ART = {
    "Surprise Attack":"cards/surprise.png","Summon X Minions":"cards/summonX.png",
    "Summon 1 Minion":"cards/summon.png","Lock and Key":"cards/doors.png",
    "Empowered":"cards/diaginal.png","Drowning Paralysis":"cards/drown.png",
    "Deathly Fear":"cards/necro.png","Curse of Shadows":"cards/curse.png",
    "Crush Forward":"cards/move.png","Creeping Death":"cards/minmove.png",
    "SpellBook +2":"cards/spell2.png","SpellBook +1":"cards/spell1.png",
    "Revive":"cards/revive.png","Rally The Party":"cards/gather.png",
    "HideOut":"cards/house.png","empty":"cards/empty.png",
    "Distraction":"cards/distract.png","Counter Spell":"cards/aid.png",
    "Corrupted Potion":"cards/corrupt.png","Brew a Potion":"cards/potion.png",
    "Boots6":"cards/bootR.png","Boots4":"cards/bootB.png","Boots2":"cards/bootG.png",
    "Aggressive Sprint":"cards/sprint.png",
}

cards = []
with open(os.path.join(ROOT, "cards_decks.csv")) as f:
    for row in csv.reader(f):
        if not row or len(row) < 14:
            continue
        name = clean(row[5])
        if not name:
            continue
        deck = clean(row[7])
        cards.append({
            "id": num(row[0]),
            "name": name,
            "deck": deck,                       # Black (monster) / White (hero)
            "side": "monster" if deck == "Black" else "hero",
            "timing": clean(row[1]).lower(),    # draw / hand
            "copies": num(row[11]) or 1,
            "cost": clean(row[13]) or "0",
            "text": clean(row[12]),
            "art": CARD_ART.get(name, ""),
            "raw": [clean(c) for c in row],
        })

os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
def dump(fn, obj):
    with open(os.path.join(ROOT, "data", fn), "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print(f"wrote data/{fn}: {len(obj)} entries")

dump("heroes.json", heroes)
dump("monsters.json", monsters)
dump("cards.json", cards)

# embedded copy so index.html works from file:// with no server
with open(os.path.join(ROOT, "js", "gamedata.js"), "w") as f:
    f.write("// AUTO-GENERATED from data/*.json by tools/convert.py — do not hand-edit.\n")
    f.write("// Embedded fallback so the app loads when opened directly (file://).\n")
    f.write("window.GAME_DATA = ")
    json.dump({"heroes":heroes,"monsters":monsters,"cards":cards}, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("wrote js/gamedata.js")
