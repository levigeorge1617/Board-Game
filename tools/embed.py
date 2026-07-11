#!/usr/bin/env python3
"""Re-embed data/*.json into js/gamedata.js (window.GAME_DATA).

data/*.json is the source of truth for the running app (see js/designer.js).
tools/convert.py is the legacy one-shot CSV importer; DO NOT run it to pick up
hand-authored balance changes — it would overwrite the JSON from the old CSVs.
Edit the JSON (or the Designer), then run this to refresh the embedded copy.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(name):
    with open(os.path.join(ROOT, "data", name)) as f:
        return json.load(f)


data = {"heroes": load("heroes.json"), "monsters": load("monsters.json"), "cards": load("cards.json")}

with open(os.path.join(ROOT, "js", "gamedata.js"), "w") as f:
    f.write("// AUTO-GENERATED from data/*.json by tools/embed.py — do not hand-edit.\n")
    f.write("// Embedded fallback so the app loads when opened directly (file://).\n")
    f.write("window.GAME_DATA = ")
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print(f"wrote js/gamedata.js — {len(data['heroes'])} heroes, "
      f"{len(data['monsters'])} monsters, {len(data['cards'])} cards")
