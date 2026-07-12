// AUTO-GENERATED from data/*.json by tools/embed.py — do not hand-edit.
// Embedded fallback so the app loads when opened directly (file://).
window.GAME_DATA = {
  "heroes": [
    {
      "id": "paladin",
      "name": "Paladin",
      "abilities": "Guardian — the party's wall. 🛡3 and always blocks 1 hit (+1🛡 base). While you stand next to an ally, that ally rolls +1 defense die (you soak the blows). If you block EVERY skull thrown at you, your guard bites back for 1 (riposte). +1 attack die vs minions.\n\n2☼: Give an ally +1 to their next roll (lose 1 life).\n3☼: Draw an extra card.\nEnd your turn beside an ally to regain 2 life.\n\nEscape: Flee like any hero — roll Defense; shields block AND scramble you 1 space each.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n7◆: Allies 1 space away get +1 to their rolls.\n\n5◆ (6☼): Teleport next to any living ally (lose 2 life).",
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
        "vsMinionAttack": 1,
        "auraAllyDefense": 1,
        "riposte": 1
      }
    },
    {
      "id": "barbarian",
      "name": "Barbarian",
      "abilities": "Bloodlust — the angrier, the deadlier. At half life or less you roll +2 attack dice. +1 attack die vs minions, and regain 2 life whenever your strike destroys a minion — a wounded Barbarian is a rampage.\n\n4☼: On your next move, destroy every minion you end adjacent to along the way.\n\nEscape: Flee like any hero — roll Defense; shields block and scramble. Caught in a building, leave through a door for -2 life.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (3☼): Haul every minion 6+ spaces away next to you and fight them (spend extra ☼ to reach farther).",
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
        "reach": 1,
        "vsMinionAttack": 1,
        "healOnMinionKill": 2,
        "lowLifeAttack": 2
      }
    },
    {
      "id": "hunter",
      "name": "Hunter",
      "abilities": "Pack tactics — reach 2, and +1 attack die whenever your target is pinned by an ally or your pet. Flank, then fire.\n\n3☼: Summon your pet (🐾 button) — a hero-side piece (⚔1 / 🛡1 / ❤3). 2☼: your pet takes an action. The pet shares your movement rolls (not bonus dice), flies over obstacles (not walls), and is DESTROYED if it ever fights the monster itself. Use it to pin targets for your shots.\n\nEscape: Flee like any hero — your reach keeps you clear.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (6☼): Summon a second pet.",
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
        "reach": 2,
        "flanking": 1
      }
    },
    {
      "id": "scout",
      "name": "Scout",
      "abilities": "Recon — sees far (sight 8) and is never truly cornered. Once each turn you may Flee even on 0 shields: you take the hit but ALWAYS slip out of sight/reach.\n\n1☼: +2 to your movement roll.\n5֍: spend a movement roll as an action.\n\nEscape: your Flee never fails to move you — the party's escape artist.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (4☼): Dash to any wall in line of sight, then end your turn.",
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
        "life": 5,
        "sight": 8
      },
      "combat": {
        "attack": 2,
        "defense": 2,
        "reach": 1
      }
    },
    {
      "id": "wizard",
      "name": "Wizard",
      "abilities": "Arcane artillery — frail (❤4) but casts at reach 2, and your bolts PIERCE 1 (ignore one of the target's shields — armor won't save them). Your power grows: at 5 objectives your attack is +2 dice.\n\n2☼: Reroll any of your dice this turn.\n4☼: Draw an extra card.\nYou may discard a card to draw another.\n\nEscape: Flee like any hero — you're fragile, so break line of sight fast.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n3◇: Relocate 1 door.\n5◇: Relocate 1 door.\n4◆: Gain a ֍ bonus die.\n5◆: Spell power +2 attack dice (permanent).\n7◆: Gain a ☼ bonus die.\n\n5◆ (6☼): Trade places with any object on the board.",
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
        "reach": 2,
        "pierce": 1,
        "attackLadder": [
          {
            "at": 5,
            "attack": 3
          }
        ]
      }
    },
    {
      "id": "enchantress",
      "name": "Enchantress",
      "abilities": "Hexweaver — every enemy you strike is HEXED: −1 attack die until the end of the turn. Hit the monster or a minion to blunt it for your allies.\n\n4☼: Walk through a wall.\n5☼: Move a monster or an ally 1 space.\nYou may discard a card to draw another.\n\nEscape: Flee like any hero — roll Defense, then reposition out of sight.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n4◆ (6☼): Play any ally's card on any hero.\n5◆ (7☼): Use an action anywhere on the board.",
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
        "reach": 1,
        "hexOnHit": 1
      }
    },
    {
      "id": "thief",
      "name": "Thief",
      "abilities": "Backstab — high attack (⚔4) that IGNORES WALLS (strike through cover; your line of sight isn't blocked by walls) and PIERCES 1 (ignore a shield). +1 attack die when the target is flanked by an ally or pet. Moves diagonally (GREEN). A glass dagger: ⚔4 but 🛡1 / ❤5.\n\n1☼ + 2֍: Use an action 2 spaces away.\n5☼: Use an ally hero's card.\n\nEscape: Flee like any hero — slip through a wall to break line of sight instantly.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (6☼): Cannot be targeted or seen until your next turn.",
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
        "ignoreCoverAttack": true,
        "pierce": 1,
        "flanking": 1
      }
    },
    {
      "id": "ranger",
      "name": "Ranger",
      "abilities": "Sharpshooter — reach 3, and +1 attack die when you strike from 2+ spaces away. Stay back and pick them off. Moves diagonally (GREEN).\n\n2☼: Deal 2 damage to a minion in line of sight within reach.\n3☼ + 4֍: Move an objective 1 space.\n\nEscape: Flee like any hero — your range means you're rarely cornered.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (4☼): Reroll any of your movement dice.",
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
      "abilities": "Shapeshifter — 3☼: Transform (persists until you change again; may be re-cast several times per turn). 4☼: Transform an ally for this turn.\n\nBEAR: +1⚔ / +1🛡, and take 1 less die from minions.\nTURTLE: +2🛡, and its shell RIPOSTES 1 (block everything → bite back for 1).\nCHEETAH: -1🛡, but +2 to movement rolls (fast, fragile).\nDEER: -1🛡; for 1☼ restore 2 life to any hero (fragile healer).\n\nEscape: Flee like any hero — BEAR/TURTLE flee best (more shields).",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (3☼): Draw an extra card.",
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
      "abilities": "Blessed guardian — 🛡3 and always blocks 1 hit (+1🛡 base): very hard to put down.\n\n4☼: Restore 3 life to any living hero.\n12☼: Revive any hero to half health (ends both heroes' turns).\nBoth your dice count as actions OR movement.\n\nEscape: Flee like any hero — lean on your defense to block and slip away.",
      "objectiveAbilities": "2,5,6◇: Draw a card.\n4◆: Gain a ֍ bonus die.\n7◆: Gain a ☼ bonus die.\n\n5◆ (3☼): Give an ally +2 to a roll (you lose 2 life).",
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
        "baseShield": 1
      }
    }
  ],
  "monsters": [
    {
      "id": "maraurnzol",
      "name": "Maraurn'Zol",
      "abilities": "Movement — RAMPAGE (meteor). On her turn, roll the grid and crash her down on that square. EVERY hero in line of sight of where she lands takes her Strike — this is the meteor. Her Strike (meteor only) ignores all cover: it burns through objects and walls.\n\nx◆: +1 Rampage (extra meteor) for every 4 objectives taken.\n2◆: Meteor blast radius 1 (also Strike the ring around the impact).\n4◆: Meteor blast radius 2.\n7◆: Meteor blast radius 3.\n\nAdvance: instead of a meteor she may walk 1 space. From an Advance she makes only a NORMAL melee Strike — reach 1, needs clear line of sight, no cover-ignore and no blast. Sight 6.\n\nEscape: a struck hero may Flee — roll Defense; shields block the hit and scramble 1 space each. Get out of line of sight to be safe.",
      "objectiveAbilities": "6◇: Add a CLONE of Maraurn'Zol (use the ✚ Clone button on her sheet). The clone takes its own Rampage after her with the same blast radius, and — like her — can't be killed, only shoved.\n\n9◇: Meteor Storm — take one extra Rampage; every hero not behind a full wall is Struck.",
      "element": "Fire",
      "art": "players/bad5.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 6,
        "moveStyle": "rampage",
        "rampageEvery": 4
      },
      "combat": {
        "attack": 5,
        "defense": 0,
        "reach": 1,
        "ignoreCover": true,
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
      "abilities": "Movement — CREEP. The Fog never teleports. Roll its movement die (D20) — its own +2 is added for you — and slide it forward that many spaces, engulfing everything it rolls over. It creeps faster the deeper the game runs.\n\n1◆: Strike all heroes 1 space away.\n4◆: Reach 2 — strike heroes 2 spaces away.\n8◆: Reach 3 — strike heroes 3 spaces away.\n2◆: +D4 to movement rolls.\n4◆: +D4 to movement rolls.\n\nHeroes inside a building are SAFE — the Fog cannot strike them. Sight 6.\n\nEscape: do NOT try to shove it back (its reach outgrows the push and you stay pinned — a loop). Break line of sight or step into a building. The Fog is slow early; outrun it while you can.",
      "objectiveAbilities": "2◇: The Fog sees heroes through all objects — but still NOT through building walls.\n\n9◇: Suffocate — kill up to 2 heroes who are not inside a building.",
      "element": "Smoke",
      "art": "players/bad4.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": 20,
        "sight": 6,
        "moveStyle": "creep",
        "rampageEvery": 0,
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
      "abilities": "Movement — STALK. Each turn he steps forward in a straight line toward the nearest hero. He cannot enter buildings (cannot pass through doors). While stalking his sight drops to 1 — slip out of his lane and he loses your scent.\n\nx◆: +1 Stalk for every 4 objectives taken.\n2◆: Stalk 3 spaces.\n4◆: Stalk 3 more spaces.\n6◆: Stalk 3 more spaces.\n3◆: Place a barrier (use the 🧱 Barrier button). Barriers block movement and line of sight.\n4◆: Ghathag is enraged — permanent +2 attack (his Strike becomes ⚔6). Being cornered by him is now deadly.\n\nSight 4 (only 1 while stalking).\n\nEscape: a hero he reaches may Flee — roll Defense; shields block and scramble. Duck through a door; he can't follow you inside.",
      "objectiveAbilities": "3◇: Place 2 barriers.\n5◇: Place 2 barriers.\n4◆: Barriers placed now have +2 life.\n7◆: Barriers placed now have +2 more life.\n9◇: Turn every barrier into a minion (roll each for its health).",
      "element": "Claw",
      "art": "players/bad2.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 4,
        "stalkSight": 1,
        "moveStyle": "stalk",
        "rampageEvery": 4
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
      "abilities": "Movement — OOZE. Oblex moves with the GRID ROLL (roll the grid, slide it there) — random repositioning, not a controlled walk. After moving it may trade places with any minion (its real teleport). It does NOT gain extra moves as objectives are taken.\n\nUnlike a Rampage, an OOZE does NOT strike everyone in sight — Oblex is no bruiser. It only makes a weak normal Strike (⚔2) on a hero it lands next to; the danger is that it SWAPS a strong minion into your face instead.\n\n1◆: Summon minions equal to 1 + 1 per 3 objectives taken (roll each d4 for health).\n3◆: Or, instead of summoning, give +1 attack to one minion.\n5◆: All minions may move 2 spaces each turn.\n\nMinion baseline: ⚔2 / 🛡1 / ❤ d4. Its ladder buffs below apply to EVERY minion automatically. Sight 4.\n\nEscape: a hero a minion reaches may Flee — roll Defense; shields block and scramble. Break line of sight from the swarm.",
      "objectiveAbilities": "1◇: Summon 2 minions.\n3◇: Summon 3 minions.\n5◇: Summon 4 minions.\n4◆: Every minion gets +1 attack (automatic).\n6◆: Every minion gets +1 reach (automatic).\n7◆: Every minion gets +1 attack (automatic).\n9◇: Double the number of minions on the board.",
      "element": "Flesh",
      "art": "players/bad3.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 4,
        "moveStyle": "ooze",
        "rampageEvery": 0
      },
      "combat": {
        "attack": 2,
        "defense": 0,
        "reach": 1
      }
    },
    {
      "id": "wyhtthetrickster",
      "name": "Wyht, the Trickster",
      "abilities": "Movement — BLINK. She flits around the board: roll the grid to blink her to a random square (a short Rampage), positioning for her tricks. She wins by disruption, not by blows.\n\nx◆: +1 Blink for every 3 objectives taken.\n2◆: Relocate any 1 objective to a space you choose.\n4◆: Every hero discards 1 card — or one hero of your choice discards 2.\n6◆: Draw 2 monster cards, OR one hero of your choice discards down to 4 cards.\n8◆: Swap the positions of two objectives, or add +1 to one objective's value.\n\nWyht draws an extra card whenever she draws. Sight 5.\n\nA Blink that passes a hero in line of sight lets her Strike that hero (weak, ⚔2). They may Flee — roll Defense.",
      "objectiveAbilities": "1◇: Add 1 objective to the board (this raises the heroes' goal).\n3◇: Randomly relocate ALL objectives.\n5◇: Add 1 objective to the board.\n10◇: Choose a hero — they die.",
      "element": "Mind",
      "art": "players/bad1.jpg",
      "stats": {
        "monsterDie": 6,
        "movementDie": null,
        "sight": 5,
        "moveStyle": "blink",
        "rampageEvery": 3
      },
      "combat": {
        "attack": 2,
        "defense": 0,
        "reach": 1
      }
    }
  ],
  "cards": [
    {
      "id": 268,
      "name": "Surprise Attack",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 10,
      "cost": "0",
      "text": "Choose the number and randomize\nthe letter for your next movement.\n\nThis can only be played instantly at the beginning of your turn.\n\nCan't be used on the turn it is drawn.",
      "art": "cards/surprise.png",
      "raw": [
        "268",
        "draw",
        "1",
        "0",
        "0",
        "Surprise Attack",
        "0",
        "Black",
        "1",
        "0",
        "",
        "10",
        "Choose the number and randomize\nthe letter for your next movement.\n\nThis can only be played instantly at the beginning of your turn.\n\nCan't be used on the turn it is drawn.",
        "0"
      ]
    },
    {
      "id": 269,
      "name": "Summon X Minions",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 10,
      "cost": "X☼",
      "text": "Randomly summon X Minions",
      "art": "cards/summonX.png",
      "raw": [
        "269",
        "draw",
        "1",
        "0",
        "0",
        "Summon X Minions",
        "0",
        "Black",
        "1",
        "0",
        "",
        "10",
        "Randomly summon X Minions",
        "X☼"
      ]
    },
    {
      "id": 284,
      "name": "Summon 1 Minion",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 15,
      "cost": "0",
      "text": "Randomly summon 1 Minion",
      "art": "cards/summon.png",
      "raw": [
        "284",
        "draw",
        "1",
        "0",
        "0",
        "Summon 1 Minion",
        "0",
        "Black",
        "1",
        "0",
        "",
        "15",
        "Randomly summon 1 Minion",
        "0"
      ]
    },
    {
      "id": 77,
      "name": "Lock and Key",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 3,
      "cost": "0",
      "text": "Choose an entrance to a building and place a lock on it. \nRandomly place a key on the map.▲\n\nHeroes must collect the key and use it on the locked door to open it. The hero who collects the key must use an action to unlock the door.\n\nIf a hero dies with a collected key, they drop the\n              Key beside them. Reroll the cost.",
      "art": "cards/doors.png",
      "raw": [
        "77",
        "draw",
        "1",
        "0",
        "0",
        "Lock and Key",
        "0",
        "Black",
        "1",
        "0",
        "",
        "3",
        "Choose an entrance to a building and place a lock on it. \nRandomly place a key on the map.▲\n\nHeroes must collect the key and use it on the locked door to open it. The hero who collects the key must use an action to unlock the door.\n\nIf a hero dies with a collected key, they drop the\n              Key beside them. Reroll the cost.",
        "0"
      ]
    },
    {
      "id": 260,
      "name": "Empowered",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 5,
      "cost": "0",
      "text": "The monster's next Strike this turn rolls +2 attack dice (its blow lands harder).",
      "effect": {
        "attackDice": 2,
        "scope": "attack",
        "duration": "turn"
      },
      "art": "cards/diaginal.png",
      "raw": [
        "260",
        "draw",
        "1",
        "0",
        "0",
        "Empowered",
        "0",
        "Black",
        "1",
        "0",
        "",
        "5",
        "The monster's next turn movement can kill heroes diagonally\n\nAll other monster rules still apply",
        "0"
      ]
    },
    {
      "id": 95,
      "name": "Drowning Paralysis",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 5,
      "cost": "0",
      "text": "Choose a hero. They lose a turn.",
      "art": "cards/drown.png",
      "raw": [
        "95",
        "draw",
        "1",
        "0",
        "0",
        "Drowning Paralysis",
        "0",
        "Black",
        "1",
        "0",
        "",
        "5",
        "Choose a hero. They lose a turn.",
        "0"
      ]
    },
    {
      "id": 104,
      "name": "Deathly Fear",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 8,
      "cost": "X☼",
      "text": "Choose X heroes.\n\nThey all have -2 to their actions and -4 to movements their next turn",
      "art": "cards/necro.png",
      "raw": [
        "104",
        "draw",
        "1",
        "0",
        "0",
        "Deathly Fear",
        "0",
        "Black",
        "1",
        "0",
        "",
        "8",
        "Choose X heroes.\n\nThey all have -2 to their actions and -4 to movements their next turn",
        "X☼"
      ]
    },
    {
      "id": 113,
      "name": "Curse of Shadows",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 10,
      "cost": "X☼",
      "text": "Target a hero\n\nThey have -X+1 to their next action and movement rolls",
      "art": "cards/curse.png",
      "raw": [
        "113",
        "Draw",
        "1",
        "0",
        "0",
        "Curse of Shadows",
        "0",
        "Black",
        "1",
        "0",
        "",
        "10",
        "Target a hero\n\nThey have -X+1 to their next action and movement rolls",
        "X☼"
      ]
    },
    {
      "id": 132,
      "name": "Crush Forward",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 8,
      "cost": "X☼",
      "text": "Move a monster or minion X spaces.\n\nMovement can be divided between multiple minions and the monster.\n\nIf this move lets the monster or a minion Strike a hero, that hero may Flee (roll Defense) as normal.",
      "art": "cards/move.png",
      "raw": [
        "132",
        "draw",
        "1",
        "0",
        "0",
        "Crush Forward",
        "0",
        "Black",
        "1",
        "0",
        "",
        "8",
        "Move a monster or minion X spaces.\n\nMovement can be divided between multiple minions and the monster.\n\nIf the monster is able to attack a hero by moving this way, allow the hero to escape by rolling a 3 action or higher",
        "X☼"
      ]
    },
    {
      "id": 142,
      "name": "Creeping Death",
      "deck": "Black",
      "side": "monster",
      "timing": "draw",
      "copies": 10,
      "cost": "X☼",
      "text": "Move any minion X spaces.\n\nMovement can be divided between multiple minions.",
      "art": "cards/minmove.png",
      "raw": [
        "142",
        "draw",
        "1",
        "0",
        "0",
        "Creeping Death",
        "0",
        "Black",
        "1",
        "0",
        "",
        "10",
        "Move any minion X spaces.\n\nMovement can be divided between multiple minions.",
        "X☼"
      ]
    },
    {
      "id": 151,
      "name": "SpellBook +2",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 10,
      "cost": "0",
      "text": "Increase your next action roll by +2 for one turn only.",
      "art": "cards/spell2.png",
      "raw": [
        "151",
        "hand",
        "1",
        "0",
        "0",
        "SpellBook +2",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase your next action roll by +2 for one turn only.",
        "0"
      ]
    },
    {
      "id": 162,
      "name": "SpellBook +1",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "0",
      "text": "Increase your next action roll by +1 for one turn only",
      "art": "cards/spell1.png",
      "raw": [
        "162",
        "draw",
        "1",
        "1",
        "0",
        "SpellBook +1",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase your next action roll by +1 for one turn only",
        "0"
      ]
    },
    {
      "id": 286,
      "name": "Revive",
      "deck": "White",
      "side": "hero",
      "timing": "hand",
      "copies": 8,
      "cost": "3☼",
      "text": "Revive a hero who died.\n\nSet the revived hero's health to 4 (same as a normal revive).\n\nThe revived hero can not use their action dice this turn, but can use movement dice.",
      "art": "cards/revive.png",
      "raw": [
        "286",
        "hand",
        "1",
        "0",
        "0",
        "Revive",
        "0",
        "White",
        "0",
        "0",
        "",
        "8",
        "Revive a hero who died.\n\nSet the hero's health to their max -5\n\nThe revived hero can not use their action dice this turn, but can use movement dice.",
        "3☼"
      ]
    },
    {
      "id": 170,
      "name": "Rally The Party",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 8,
      "cost": "X☼",
      "text": "Move X heroes to your hero. They choose which space to be placed, they can't be placed through walls.\n\nYou can only move heroes who have already taken their turn.",
      "art": "cards/gather.png",
      "raw": [
        "170",
        "draw",
        "1",
        "1",
        "0",
        "Rally The Party",
        "0",
        "White",
        "0",
        "0",
        "",
        "8",
        "Move X heroes to your hero. They choose which space to be placed, they can't be placed through walls.\n\nYou can only move heroes who have already taken their turn.",
        "X☼"
      ]
    },
    {
      "id": 175,
      "name": "HideOut",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 6,
      "cost": "3☼",
      "text": "Move to the nearest door and enter it.\n\nIf the distance to the nearest door is a tie, you can choose which to go to.",
      "art": "cards/house.png",
      "raw": [
        "175",
        "draw",
        "1",
        "1",
        "0",
        "HideOut",
        "0",
        "White",
        "0",
        "0",
        "",
        "6",
        "Move to the nearest door and enter it.\n\nIf the distance to the nearest door is a tie, you can choose which to go to.",
        "3☼"
      ]
    },
    {
      "id": 192,
      "name": "empty",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 25,
      "cost": "0",
      "text": "You find nothing.",
      "art": "cards/empty.png",
      "raw": [
        "192",
        "draw",
        "1",
        "1",
        "0",
        "empty",
        "0",
        "White",
        "0",
        "0",
        "",
        "25",
        "You find nothing.",
        "0"
      ]
    },
    {
      "id": 196,
      "name": "Distraction",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "1☼",
      "text": "Make a monster or minion move 1 space in any direction\n\nThey can not move through walls or other objects.\n\nYou can not move them in a space that would initiate an attack or combat.",
      "art": "cards/distract.png",
      "raw": [
        "196",
        "draw",
        "1",
        "1",
        "0",
        "Distraction",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Make a monster or minion move 1 space in any direction\n\nThey can not move through walls or other objects.\n\nYou can not move them in a space that would initiate an attack or combat.",
        "1☼"
      ]
    },
    {
      "id": 285,
      "name": "Counter Spell",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "3☼",
      "text": "Once you use this card, you can negate the effects of any one card used by the monster on their turn.",
      "art": "cards/aid.png",
      "raw": [
        "285",
        "draw",
        "1",
        "1",
        "0",
        "Counter Spell",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Once you use this card, you can negate the effects of any one card used by the monster on their turn.",
        "3☼"
      ]
    },
    {
      "id": 205,
      "name": "Corrupted Potion",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 11,
      "cost": "0",
      "text": "The monster draws a card instead.",
      "art": "cards/corrupt.png",
      "raw": [
        "205",
        "draw",
        "1",
        "1",
        "0",
        "Corrupted Potion",
        "0",
        "White",
        "0",
        "0",
        "",
        "11",
        "The monster draws a card instead.",
        "0"
      ]
    },
    {
      "id": 219,
      "name": "Brew a Potion",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "X☼",
      "text": "Restore X+2 health to you or a nearby hero.",
      "art": "cards/potion.png",
      "raw": [
        "219",
        "draw",
        "1",
        "1",
        "0",
        "Brew a Potion",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Restore X+2 health to you or a nearby hero.",
        "X☼"
      ]
    },
    {
      "id": 223,
      "name": "Boots6",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "1☼",
      "text": "Increase the next movement roll by +6 for one turn only.",
      "art": "cards/bootR.png",
      "raw": [
        "223",
        "draw",
        "1",
        "1",
        "0",
        "Boots6",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase the next movement roll by +6 for one turn only.",
        "1☼"
      ]
    },
    {
      "id": 232,
      "name": "Boots4",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "0",
      "text": "Increase the next movement roll by +4 for one turn only.",
      "art": "cards/bootB.png",
      "raw": [
        "232",
        "draw",
        "1",
        "1",
        "0",
        "Boots4",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase the next movement roll by +4 for one turn only.",
        "0"
      ]
    },
    {
      "id": 246,
      "name": "Boots2",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "0",
      "text": "Increase the next movement roll by +2 for one turn only.",
      "art": "cards/bootG.png",
      "raw": [
        "246",
        "draw",
        "1",
        "1",
        "0",
        "Boots2",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase the next movement roll by +2 for one turn only.",
        "0"
      ]
    },
    {
      "id": 255,
      "name": "Aggressive Sprint",
      "deck": "White",
      "side": "hero",
      "timing": "draw",
      "copies": 10,
      "cost": "0",
      "text": "Increase your next movement and your next action roll by +2 for one turn only.",
      "art": "cards/sprint.png",
      "raw": [
        "255",
        "draw",
        "1",
        "1",
        "0",
        "Aggressive Sprint",
        "0",
        "White",
        "0",
        "0",
        "",
        "10",
        "Increase your next movement and your next action roll by +2 for one turn only.",
        "0"
      ]
    }
  ]
};
