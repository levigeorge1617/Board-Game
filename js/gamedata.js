// AUTO-GENERATED from data/*.json by tools/embed.py — do not hand-edit.
// Embedded fallback so the app loads when opened directly (file://).
window.GAME_DATA = {
  "heroes": [
    {
      "id": "paladin",
      "name": "Paladin",
      "abilities": "The wall — 🛡3 and always blocks 1 hit (+1🛡). Heavy armour makes him slow to Flee. Reach 1: a foe striking from beyond his reach takes no blow back, so keep him in the front line.\n\n2☼: Give an ally +1 to their next roll (lose 1 life).\n3☼: Draw an extra card.\nEnd your turn beside an ally to regain 2 life.",
      "objectiveAbilities": "7◆: Allies 1 space away get +1 to their rolls.\n\n5◆ (6☼): Teleport next to any living ally (lose 2 life).",
      "color": "RED",
      "pair": "red",
      "cardFace": "front",
      "art": "players/red2.jpg",
      "stats": {
        "a1": 4,
        "a2": null,
        "m1": 12,
        "m2": null,
        "ba": 4,
        "bm": 6,
        "life": 8
      },
      "combat": {
        "attack": 2,
        "defense": 3,
        "reach": 1,
        "baseShield": 1,
        "fleeMod": 1
      }
    },
    {
      "id": "barbarian",
      "name": "Barbarian",
      "abilities": "Raw power — ⚔4, reach 1. A pure melee bruiser: he hits hardest toe-to-toe, but an enemy striking from beyond his reach takes no counter, so a ranged foe can wear him down. Heavy — slow to Flee.\n\n4☼: On your next move, destroy every minion you end adjacent to along the way.",
      "objectiveAbilities": "5◆ (3☼): Haul every minion 6+ spaces away next to you and fight them (spend extra ☼ to reach farther).",
      "color": "RED",
      "pair": "red",
      "cardFace": "back",
      "art": "players/red1.jpg",
      "stats": {
        "a1": 4,
        "a2": null,
        "m1": 12,
        "m2": null,
        "ba": 4,
        "bm": 6,
        "life": 8
      },
      "combat": {
        "attack": 4,
        "defense": 2,
        "reach": 1
      }
    },
    {
      "id": "hunter",
      "name": "Hunter",
      "abilities": "Marksman — reach 2, so he strikes minions that can't strike back.\n\n3☼: Summon your pet (🐾 button) — a hero-side piece (⚔1 / 🛡1 / ❤3). 2☼: your pet takes an action. The pet shares your movement rolls (not bonus dice), flies over obstacles (not walls), and is DESTROYED if it ever fights the monster itself.",
      "objectiveAbilities": "5◆ (6☼): Summon a second pet.",
      "color": "YELLOW",
      "pair": "yellow",
      "cardFace": "front",
      "art": "players/yellow1.jpg",
      "stats": {
        "a1": 4,
        "a2": null,
        "m1": 20,
        "m2": null,
        "ba": 6,
        "bm": 12,
        "life": 6
      },
      "combat": {
        "attack": 3,
        "defense": 1,
        "reach": 2
      }
    },
    {
      "id": "scout",
      "name": "Scout",
      "abilities": "Nimble — the party's escape artist: he Flees on 1 fewer shield than anyone else.\n\n1☼: +2 to your movement roll.\n5֍: spend a movement roll as an action.",
      "objectiveAbilities": "5◆ (4☼): Dash to any wall in line of sight, then end your turn.",
      "color": "YELLOW",
      "pair": "yellow",
      "cardFace": "back",
      "art": "players/yellow2.jpg",
      "stats": {
        "a1": 4,
        "a2": null,
        "m1": 20,
        "m2": null,
        "ba": 6,
        "bm": 12,
        "life": 5
      },
      "combat": {
        "attack": 2,
        "defense": 2,
        "reach": 1,
        "fleeMod": -1
      }
    },
    {
      "id": "wizard",
      "name": "Wizard",
      "abilities": "Caster — strikes at reach 2 but frail (⚔1 / 🛡1 / ❤4). Wins through spell cards, not blows.\n\n2☼: Reroll any of your dice this turn.\n4☼: Draw an extra card.\nYou may discard a card to draw another.",
      "objectiveAbilities": "3◇: Relocate 1 door.\n5◇: Relocate 1 door.\n\n5◆ (6☼): Trade places with any object on the board.",
      "color": "BLUE",
      "pair": "blue",
      "cardFace": "front",
      "art": "players/blue2.jpg",
      "stats": {
        "a1": 6,
        "a2": null,
        "m1": 4,
        "m2": 4,
        "ba": 4,
        "bm": 4,
        "life": 4
      },
      "combat": {
        "attack": 1,
        "defense": 1,
        "reach": 2
      }
    },
    {
      "id": "enchantress",
      "name": "Enchantress",
      "abilities": "Controller — bends the board rather than trading blows (⚔1 / 🛡1). Win with utility.\n\n4☼: Walk through a wall.\n5☼: Move a monster or an ally 1 space.\nYou may discard a card to draw another.",
      "objectiveAbilities": "4◆ (6☼): Play any ally's card on any hero.\n5◆ (7☼): Use an action anywhere on the board.",
      "color": "BLUE",
      "pair": "blue",
      "cardFace": "back",
      "art": "players/blue1.jpg",
      "stats": {
        "a1": 4,
        "a2": 4,
        "m1": 6,
        "m2": null,
        "ba": 4,
        "bm": 4,
        "life": 5
      },
      "combat": {
        "attack": 1,
        "defense": 1,
        "reach": 1
      }
    },
    {
      "id": "thief",
      "name": "Thief",
      "abilities": "Assassin — ⚔4 and slips away easily (Flees on 1 fewer shield), but fragile (🛡1 / ❤5). Reach 1: devastating up close. Moves diagonally (GREEN).\n\n1☼ + 2֍: Use an action 2 spaces away.\n5☼: Use an ally hero's card.",
      "objectiveAbilities": "5◆ (6☼): Cannot be targeted or seen until your next turn.",
      "color": "GREEN",
      "pair": "green",
      "cardFace": "front",
      "art": "players/green1.jpg",
      "stats": {
        "a1": 8,
        "a2": null,
        "m1": 10,
        "m2": 4,
        "ba": 4,
        "bm": 10,
        "life": 5
      },
      "combat": {
        "attack": 4,
        "defense": 1,
        "reach": 1,
        "fleeMod": -1
      }
    },
    {
      "id": "ranger",
      "name": "Ranger",
      "abilities": "Sharpshooter — reach 3, and +1 attack die when striking from 2+ spaces away. Staying back keeps him safe: a target he out-reaches can't strike back. Moves diagonally (GREEN).\n\n2☼: Deal 2 damage to a minion within reach.\n3☼ + 4֍: Move an objective 1 space.",
      "objectiveAbilities": "5◆ (4☼): Reroll any of your movement dice.",
      "color": "GREEN",
      "pair": "green",
      "cardFace": "back",
      "art": "players/green2.jpg",
      "stats": {
        "a1": 4,
        "a2": null,
        "m1": 10,
        "m2": 8,
        "ba": 4,
        "bm": 10,
        "life": 6
      },
      "combat": {
        "attack": 3,
        "defense": 2,
        "reach": 3,
        "rangedAttack": 1,
        "rangedFrom": 1
      }
    },
    {
      "id": "druid",
      "name": "Druid",
      "abilities": "Shapeshifter — 3☼: Transform (persists until you change again; may be re-cast several times a turn). 4☼: Transform an ally for this turn. Your sheet shows the active form's roll bonuses.\n\nBEAR: +1⚔ / +1🛡 (bruiser).\nTURTLE: +2🛡 (shell).\nCHEETAH: -1🛡, +2 to movement rolls (fast, fragile).\nDEER: -1🛡; for 1☼ restore 2 life to any hero (fragile healer).",
      "objectiveAbilities": "5◆ (3☼): Draw an extra card.",
      "color": "PURPLE",
      "pair": "purple",
      "cardFace": "front",
      "art": "players/purple2.jpg",
      "stats": {
        "a1": 6,
        "a2": null,
        "m1": 8,
        "m2": null,
        "ba": 4,
        "bm": 10,
        "life": 6
      },
      "combat": {
        "attack": 2,
        "defense": 2,
        "reach": 1
      }
    },
    {
      "id": "cleric",
      "name": "Cleric",
      "abilities": "Blessed — 🛡3 and always blocks 1 hit (+1🛡): very hard to put down, though heavy and slow to Flee.\n\n4☼: Restore 3 life to any living hero.\n12☼: Revive any hero to half health (ends both heroes' turns).\nBoth your dice count as actions OR movement.",
      "objectiveAbilities": "5◆ (3☼): Give an ally +2 to a roll (you lose 2 life).",
      "color": "PURPLE",
      "pair": "purple",
      "cardFace": "back",
      "art": "players/purple1.jpg",
      "stats": {
        "a1": 6,
        "a2": 8,
        "m1": 8,
        "m2": 6,
        "ba": 4,
        "bm": 6,
        "life": 6
      },
      "combat": {
        "attack": 1,
        "defense": 3,
        "reach": 1,
        "baseShield": 1,
        "fleeMod": 1
      }
    }
  ],
  "monsters": [
    {
      "id": "maraurnzol",
      "name": "Maraurn'Zol",
      "abilities": "A glass cannon that strikes from anywhere. On a GRID ROLL (both axes random — she can't aim) she lands and hits EVERY hero within her large sight (7), hard (⚔5) and THROUGH walls and objects. Her reach also applies to the grid roll, so she hits everyone within her blast radius of the landing too.\n\nx◆: +1 grid roll for every 4 objectives.\n2◆: Blast radius 1.\n4◆: Blast radius 2.\n7◆: Blast radius 3.\n\nIf she MOVES instead, she makes only a weak melee strike (⚔2, reach 1). Easy to shove back (🛡0) — the only safety is out of her sight.",
      "objectiveAbilities": "6◇: Add a copy of Maraurn'Zol (✚ Clone button). It takes its own grid-roll attack after her, with the same blast radius, and can't be killed — only shoved.\n\n9◇: Take one extra grid-roll attack; every hero not behind a full wall is hit.",
      "element": "Fire",
      "art": "players/bad5.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 7,
        "gridAxis": "random",
        "gridRolls": 1,
        "gridRollsEvery": 4,
        "moves": 1
      },
      "combat": {
        "attack": 5,
        "moveAttack": 2,
        "defense": 0,
        "reach": 1,
        "ignoreCover": true,
        "reachAppliesToGrid": true,
        "blastLadder": [
          {
            "at": 2,
            "radius": 1
          },
          {
            "at": 4,
            "radius": 2
          },
          {
            "at": 7,
            "radius": 3
          }
        ]
      }
    },
    {
      "id": "thefog",
      "name": "The Fog",
      "abilities": "It has NO grid roll — it never teleports. It rolls its big movement die (D20, +2, and faster later) and slides forward, striking every hero within reach as it rolls over them. Its reach grows 1 → 2 → 3, so once it out-reaches you it can't be pushed back — break line of sight or get indoors.\n\n1◆: Reach 1 (strike 1 away).\n4◆: Reach 2.\n8◆: Reach 3.\n2◆: +D4 to movement rolls.\n4◆: +D4 to movement rolls.\n\nHeroes inside a building are SAFE. Sight 6.",
      "objectiveAbilities": "2◇: The Fog sees heroes through all objects — but still NOT through building walls.\n\n9◇: Kill up to 2 heroes who are not inside a building.",
      "element": "Smoke",
      "art": "players/bad4.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": 20,
        "sight": 6,
        "gridAxis": null,
        "gridRolls": 0,
        "moves": 1,
        "moveFlat": 2,
        "moveDiceLadder": [
          {
            "at": 2,
            "die": 4
          },
          {
            "at": 4,
            "die": 4
          }
        ]
      },
      "combat": {
        "attack": 3,
        "defense": 0,
        "reach": 1,
        "buildingsSafe": true,
        "reachLadder": [
          {
            "at": 4,
            "reach": 2
          },
          {
            "at": 8,
            "reach": 3
          }
        ]
      }
    },
    {
      "id": "ghathag",
      "name": "Ghathag",
      "abilities": "A stalker with NO grid roll — each move he steps toward the nearest hero and strikes at reach 1, hitting hard (⚔4, ⚔6 once enraged) and shrugging off pushes (🛡2, hard to shove). Sight 4, but only 1 while stalking — slip out of his lane and he loses you. He cannot enter buildings.\n\nx◆: +1 move for every 4 objectives.\n2◆: Step 3 spaces.\n4◆: Step 3 more.\n6◆: Step 3 more.\n3◆: Place a barrier (🧱 button) — blocks movement and line of sight.\n4◆: Enraged — permanent +2 attack (⚔6).",
      "objectiveAbilities": "3◇: Place 2 barriers.\n5◇: Place 2 barriers.\n4◆: Barriers placed now have +2 life.\n7◆: Barriers placed now have +2 more life.\n9◇: Turn every barrier into a minion (roll each for its health).",
      "element": "Claw",
      "art": "players/bad2.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 4,
        "stalkSight": 1,
        "gridAxis": null,
        "gridRolls": 0,
        "moves": 1,
        "movesEvery": 4
      },
      "combat": {
        "attack": 4,
        "defense": 2,
        "reach": 1,
        "attackLadder": [
          {
            "at": 4,
            "attack": 6
          }
        ]
      }
    },
    {
      "id": "oblex",
      "name": "Oblex",
      "abilities": "Weak itself — its minions do the fighting. On a GRID ROLL it controls the COLUMN and rolls the row, then may swap places with any minion. It gets no extra grid rolls. Its own strike is weak (⚔2, sight 4); the danger is the swarm it drops in your face, and it is hard to slip away from (flee +1).\n\n1◆: Summon 1 + 1 per 3 objectives (roll each d4 for health).\n3◆: Or give +1 attack to one minion.\n5◆: All minions may move 2 spaces each turn.\n\nMinion baseline ⚔2 / 🛡1 / ❤ d4; the ladder buffs below apply to every minion automatically.",
      "objectiveAbilities": "1◇: Summon 2 minions.\n3◇: Summon 3 minions.\n5◇: Summon 4 minions.\n4◆: Every minion gets +1 attack (automatic).\n6◆: Every minion gets +1 reach (automatic).\n7◆: Every minion gets +1 attack (automatic).\n9◇: Double the number of minions on the board.",
      "element": "Flesh",
      "art": "players/bad3.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 4,
        "gridAxis": "x",
        "gridRolls": 1,
        "gridRollsEvery": 0,
        "moves": 1
      },
      "combat": {
        "attack": 2,
        "defense": 0,
        "reach": 1,
        "fleeMod": 1
      }
    },
    {
      "id": "wyhtthetrickster",
      "name": "Wyht, the Trickster",
      "abilities": "A trickster who wins by disruption, not damage. On a GRID ROLL she CHOOSES a row or a column and rolls the other, blinking into position; a hero she passes in her sight (5) takes a weak hit (⚔2). She is easy to slip away from (flee -1).\n\nx◆: +1 grid roll for every 3 objectives.\n2◆: Relocate any 1 objective to a space you choose.\n4◆: Every hero discards 1 card — or one hero of your choice discards 2.\n6◆: Draw 2 monster cards, OR one hero of your choice discards down to 4 cards.\n8◆: Swap the positions of two objectives, or add +1 to one objective's value.\n\nWyht draws an extra card whenever she draws.",
      "objectiveAbilities": "1◇: Add 1 objective to the board (raises the heroes' goal).\n3◇: Randomly relocate ALL objectives.\n5◇: Add 1 objective to the board.\n10◇: Choose a hero — they die.",
      "element": "Mind",
      "art": "players/bad1.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 5,
        "gridAxis": "choose",
        "gridRolls": 1,
        "gridRollsEvery": 3,
        "moves": 1
      },
      "combat": {
        "attack": 2,
        "defense": 0,
        "reach": 1,
        "fleeMod": -1
      }
    }
  ],
  "cards": [
    {
      "id": 162,
      "name": "SpellBook +1",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 6,
      "cost": "0",
      "text": "Add +1 to your next action roll (this turn).",
      "art": "cards/spell1.png",
      "effect": {
        "flat": 1,
        "scope": "action",
        "duration": "once"
      }
    },
    {
      "id": 151,
      "name": "SpellBook +2",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 5,
      "cost": "1☼",
      "text": "Add +2 to your next action roll (this turn).",
      "art": "cards/spell2.png",
      "effect": {
        "flat": 2,
        "scope": "action",
        "duration": "once"
      }
    },
    {
      "id": 310,
      "name": "Focus",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "1☼",
      "text": "Add +3 to your next action roll (this turn).",
      "art": "",
      "effect": {
        "flat": 3,
        "scope": "action",
        "duration": "once"
      }
    },
    {
      "id": 246,
      "name": "Boots +2",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 6,
      "cost": "0",
      "text": "Add +2 to your next movement roll (this turn).",
      "art": "cards/bootG.png",
      "effect": {
        "flat": 2,
        "scope": "move",
        "duration": "once"
      }
    },
    {
      "id": 232,
      "name": "Boots +4",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "1☼",
      "text": "Add +4 to your next movement roll (this turn).",
      "art": "cards/bootB.png",
      "effect": {
        "flat": 4,
        "scope": "move",
        "duration": "once"
      }
    },
    {
      "id": 223,
      "name": "Boots +6",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 2,
      "cost": "2☼",
      "text": "Add +6 to your next movement roll (this turn).",
      "art": "cards/bootR.png",
      "effect": {
        "flat": 6,
        "scope": "move",
        "duration": "once"
      }
    },
    {
      "id": 255,
      "name": "Aggressive Sprint",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "0",
      "text": "Add +2 to your next action AND your next movement roll (this turn).",
      "art": "cards/sprint.png"
    },
    {
      "id": 300,
      "name": "Whetstone",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "1☼",
      "text": "+2 attack dice on your next attack this turn.",
      "art": "",
      "effect": {
        "attackDice": 2,
        "scope": "attack",
        "duration": "once"
      }
    },
    {
      "id": 301,
      "name": "Brace",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "0",
      "text": "+2 defense dice on your next defense this turn.",
      "art": "",
      "effect": {
        "defenseDice": 2,
        "scope": "defense",
        "duration": "once"
      }
    },
    {
      "id": 302,
      "name": "Called Shot",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "1☼",
      "text": "Your next attack lands +1 automatic skull, before any dice.",
      "art": "",
      "effect": {
        "skull": 1,
        "scope": "attack",
        "duration": "once"
      }
    },
    {
      "id": 311,
      "name": "Battle Fury",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 2,
      "cost": "2☼",
      "text": "+3 attack dice on your next attack this turn.",
      "art": "",
      "effect": {
        "attackDice": 3,
        "scope": "attack",
        "duration": "once"
      }
    },
    {
      "id": 312,
      "name": "Iron Skin",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "1☼",
      "text": "Until your next turn, you always block 1 extra hit (+1 shield).",
      "art": "",
      "effect": {
        "shield": 1,
        "scope": "defense",
        "duration": "turn"
      }
    },
    {
      "id": 286,
      "name": "Revive",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "3☼",
      "text": "Revive a dead hero to 4 life. It may move this turn but not use action dice.",
      "art": "cards/revive.png"
    },
    {
      "id": 219,
      "name": "Brew a Potion",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Restore X+2 life to you or a hero within 1 space.",
      "art": "cards/potion.png"
    },
    {
      "id": 313,
      "name": "First Aid",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 5,
      "cost": "1☼",
      "text": "Restore 3 life to any hero within 1 space.",
      "art": ""
    },
    {
      "id": 314,
      "name": "Second Wind",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Restore 2 life to yourself and draw a card.",
      "art": ""
    },
    {
      "id": 315,
      "name": "Scavenge",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "1☼",
      "text": "Draw 2 cards.",
      "art": ""
    },
    {
      "id": 205,
      "name": "Corrupted Potion",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 5,
      "cost": "0",
      "text": "If you draw this from the hero pile, discard it and the monster draws a card instead.",
      "art": "cards/corrupt.png"
    },
    {
      "id": 316,
      "name": "Trade Secrets",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "0",
      "text": "Give a card to an ally (use the Give button), then draw a card.",
      "art": ""
    },
    {
      "id": 175,
      "name": "HideOut",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "2☼",
      "text": "Move to the nearest door and enter that building (choose if tied).",
      "art": "cards/house.png"
    },
    {
      "id": 170,
      "name": "Rally The Party",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 4,
      "cost": "X☼",
      "text": "Move X heroes to your space (they choose where; not through walls). Only heroes who already took their turn.",
      "art": "cards/gather.png"
    },
    {
      "id": 196,
      "name": "Distraction",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 6,
      "cost": "1☼",
      "text": "Move a monster or minion 1 space (not through walls/objects, and not into a space that starts a fight).",
      "art": "cards/distract.png"
    },
    {
      "id": 317,
      "name": "Smoke Bomb",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Until your next turn you cannot be seen or targeted — slip out of any fight.",
      "art": ""
    },
    {
      "id": 318,
      "name": "Blink",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Swap places with any ally hero anywhere on the board.",
      "art": ""
    },
    {
      "id": 319,
      "name": "Guardian's Vow",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "1☼",
      "text": "An ally within 1 space rolls +2 defense dice on their next defense.",
      "art": ""
    },
    {
      "id": 285,
      "name": "Counter Spell",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "3☼",
      "text": "Negate the effects of any one card the monster plays this turn.",
      "art": "cards/aid.png"
    },
    {
      "id": 320,
      "name": "Beacon",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Move an objective 1 space in any direction (not through walls).",
      "art": ""
    },
    {
      "id": 192,
      "name": "empty",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 4,
      "cost": "0",
      "text": "You find nothing.",
      "art": "cards/empty.png"
    },
    {
      "id": 260,
      "name": "Empowered",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 4,
      "cost": "0",
      "text": "The monster's Strikes this turn roll +2 attack dice.",
      "art": "cards/diaginal.png",
      "effect": {
        "attackDice": 2,
        "scope": "attack",
        "duration": "turn"
      }
    },
    {
      "id": 330,
      "name": "Frenzy",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "2☼",
      "text": "The monster's Strikes this turn roll +3 attack dice.",
      "art": "",
      "effect": {
        "attackDice": 3,
        "scope": "attack",
        "duration": "turn"
      }
    },
    {
      "id": 303,
      "name": "Thick Hide",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "0",
      "text": "This turn the monster is hard to shove: +2 defense dice whenever it is attacked.",
      "art": "",
      "effect": {
        "defenseDice": 2,
        "scope": "defense",
        "duration": "turn"
      }
    },
    {
      "id": 331,
      "name": "Carapace",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "3☼",
      "text": "This turn the monster is almost unmovable: +3 defense dice whenever it is attacked.",
      "art": "",
      "effect": {
        "defenseDice": 3,
        "scope": "defense",
        "duration": "turn"
      }
    },
    {
      "id": 332,
      "name": "Savage Blow",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "1☼",
      "text": "The monster's Strikes this turn land +2 automatic skulls, before dice.",
      "art": "",
      "effect": {
        "skull": 2,
        "scope": "attack",
        "duration": "turn"
      }
    },
    {
      "id": 284,
      "name": "Summon 1 Minion",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 8,
      "cost": "0",
      "text": "Randomly place 1 minion (roll its d4 health).",
      "art": "cards/summon.png"
    },
    {
      "id": 269,
      "name": "Summon X Minions",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Randomly place X minions (roll each one's d4 health).",
      "art": "cards/summonX.png"
    },
    {
      "id": 333,
      "name": "Dark Ritual",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "4☼",
      "text": "Summon 3 minions next to the monster, each at full 4 health.",
      "art": ""
    },
    {
      "id": 142,
      "name": "Creeping Death",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Move any minions a total of X spaces (divide freely between them).",
      "art": "cards/minmove.png"
    },
    {
      "id": 334,
      "name": "Feeding Frenzy",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "2☼",
      "text": "Every minion rolls +1 attack die this turn.",
      "art": ""
    },
    {
      "id": 268,
      "name": "Surprise Attack",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 4,
      "cost": "0",
      "text": "Your next grid roll this turn: place the monster EXACTLY — choose both the column and the row instead of rolling.",
      "art": "cards/surprise.png"
    },
    {
      "id": 132,
      "name": "Crush Forward",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Move the monster and/or minions a total of X spaces. Any hero Struck may Flee as normal.",
      "art": "cards/move.png"
    },
    {
      "id": 335,
      "name": "Relentless",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "3☼",
      "text": "Take one extra move this turn.",
      "art": ""
    },
    {
      "id": 336,
      "name": "Overrun",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "5☼",
      "text": "Take one extra grid-roll attack this turn.",
      "art": ""
    },
    {
      "id": 337,
      "name": "Ambush",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Re-roll your next grid roll and keep whichever landing you prefer.",
      "art": ""
    },
    {
      "id": 338,
      "name": "Wall of Bone",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Place a 2-life barrier (2x1). It blocks movement and line of sight.",
      "art": ""
    },
    {
      "id": 77,
      "name": "Lock and Key",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "0",
      "text": "Lock a building door; place a key on a random space. Heroes must carry the key to the door and spend an action to unlock it.",
      "art": "cards/doors.png"
    },
    {
      "id": 95,
      "name": "Drowning Paralysis",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 4,
      "cost": "2☼",
      "text": "Choose a hero. They lose their next turn.",
      "art": "cards/drown.png"
    },
    {
      "id": 104,
      "name": "Deathly Fear",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Choose X heroes. Next turn each has -2 to action rolls and -4 to movement rolls.",
      "art": "cards/necro.png"
    },
    {
      "id": 113,
      "name": "Curse of Shadows",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 5,
      "cost": "X☼",
      "text": "Target a hero: -(X+1) to their next action and movement rolls.",
      "art": "cards/curse.png"
    },
    {
      "id": 339,
      "name": "Mind Fog",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Every hero discards 1 card of their choice.",
      "art": ""
    },
    {
      "id": 340,
      "name": "Nightmare",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 2,
      "cost": "3☼",
      "text": "A hero of your choice discards 2 cards.",
      "art": ""
    },
    {
      "id": 341,
      "name": "Terrify",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "1☼",
      "text": "A hero of your choice rolls 2 fewer defense dice on their next defense.",
      "art": ""
    },
    {
      "id": 342,
      "name": "Scatter",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 3,
      "cost": "2☼",
      "text": "Relocate an objective to a random space on the board.",
      "art": ""
    },
    {
      "id": 343,
      "name": "Blood Price",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 1,
      "cost": "6☼",
      "text": "Choose a hero within the monster's sight: they take 3 wounds (no defense roll).",
      "art": ""
    },
    {
      "id": 344,
      "name": "Cataclysm",
      "deck": "Black",
      "side": "monster",
      "timing": "hand",
      "copies": 1,
      "cost": "6☼",
      "text": "Every hero the monster can see is Struck (roll the monster's attack against each, one at a time).",
      "art": ""
    }
  ]
};
