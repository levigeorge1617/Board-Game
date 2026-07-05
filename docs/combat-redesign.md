# Combat redesign — attack/defense dice pools

Goal: replace the "both sides roll action dice and trade damage until someone
dies" loop (boring, clunky, can infinite-loop) with a fast, tactical, **single
exchange** built on Heroscape-style combat dice, with lots of room for cards to
bend the odds.

---

## 1. The combat die (custom d6)

One symbol die, six faces: **3 skull ☠ · 2 shield 🛡 · 1 blank ▢**

| Face | Count | P(one die) | Meaning |
|------|:-----:|:----------:|---------|
| ☠ skull  | 3 | 50%   | a hit (when attacking) |
| 🛡 shield | 2 | 33%   | a block (when defending) |
| ▢ blank  | 1 | 17%   | nothing |

The **same die** is used by both sides — the attacker reads **skulls**, the
defender reads **shields**. Expected value: **0.5 skulls** and **0.33 shields**
per die.

---

## 2. Combatant stat block

Every fighter (hero, monster, minion, pet) has:

| Stat | What it does |
|------|--------------|
| **HP** | health (already the hero `life` stat) |
| **Attack (A)** | # combat dice you roll **when attacking** |
| **Defense (D)** | # combat dice you roll **when defending** |

Optional modifiers (the home for cards/abilities/terrain), all stackable:
`+A dice`, `+D dice`, **auto‑skull** (a skull that always lands), **auto‑shield**,
**reroll**, **pierce N** (ignore N of the defender's shields), **parry N**
(ignore N of the attacker's skulls).

> Your "base damage" = auto‑skulls, "base shield" = auto‑shields; most fighters
> have 0 of each and rely on the dice, but heavy/armored ones get a flat point.

---

## 3. Core resolution — one exchange

Attacking is an **action** (costs 1 ☼). One attack = one exchange, **not**
repeated automatically:

1. Attacker rolls **A** dice → count **skulls** (+auto‑skulls). = **hits**
2. Defender rolls **D** dice → count **shields** (+auto‑shields). = **blocks**
3. **Wounds = max(0, hits − blocks)**. Defender loses that many HP.
4. Apply pierce/parry/rerolls in between. Done — no re‑roll‑until‑death.

Both pools roll **simultaneously** (in the 3D tray), so there's no "who goes
first" bookkeeping. This deletes every "always goes second in combat" clause.

Sanity: A3 vs D2 → ~1.5 skulls − ~0.67 shields ≈ **~0.8 wounds/exchange**. With
HP in the 4–8 range a fight is 2–4 decisive exchanges, each a real decision
(spend the action or reposition), instead of a slot‑machine.

---

## 4. Who fights whom (keeps the win condition intact)

Heroes win by objectives and **cannot kill the monster**, so:

- **Monster → hero** (on the monster's turn, via its ◆ "attack all heroes N
  away"): monster rolls **A**, each hero rolls **D**, hero takes the net wounds.
- **Hero/minion ↔ minion**: full combat, either can die.
- **Hero → monster**: can't kill it, but a hit **repels** it — for each net
  skull, **push the monster 1 space away** (breaking adjacency/LoS). This gives
  heroes a way to make space and not get pinned, without a monster HP bar.
  *(Decision A below: repel vs. a "stagger" meter vs. no hero→monster attacks.)*

---

## 5. Engagement, range, and the anti‑infinite‑loop rule

- **Range**: attacks need line of sight and the attacker's reach. Default reach
  is **adjacent (1)**; some fighters reach farther (replaces "can initiate combat
  N spaces away").
- **One action, one exchange** — combat never auto‑repeats in place.
- **Turn structure separates it naturally**: the monster attacks on *its* turn;
  heroes act on *theirs*. There is no in‑place ping‑pong.
- **Disengage**: on your turn you may move out of an enemy's reach.
  *(Decision B: free disengage, or a single "parting blow" — the enemy rolls a
  defend‑only attack as you leave.)*
- **Both survive?** Nothing forces more combat. Reposition to break LoS; combat
  only happens again if someone spends an action to attack while in range. This
  is the explicit replacement for "repeat until someone dies."

---

## 6. Escaping (reworked)

Old: roll ☼ to flee or take −5. New, unified on the combat die — when attacked,
the defender may choose **Defend** or **Flee**:

- **Defend**: roll D, block as normal.
- **Flee**: roll D; if you roll **≥1 shield** you take the hits but immediately
  move to the nearest space out of reach/LoS (choose if tied); **0 shields** =
  take the hits and stay. Escaping a building always exits via a door (−1 HP).

*(Decision C: use the combat die for escape as above, or keep the old ☼ roll.)*

---

## 7. Death, gravestone, revive

Unchanged and already implemented: HP hits 0 → gravestone with a revive counter
(roll the hero's action die) → allies spend actions to revive at HP 4. Combat
just feeds HP through the new pools.

---

## 8. Cards become dials (the big payoff)

A pool system makes cards expressive without touching core rules. Examples
(new White/hero + Black/monster cards):

| Card | Effect |
|------|--------|
| **Whetstone** | +2 attack dice for one attack |
| **Brace** | +2 defense dice for one defense |
| **Second Wind** | reroll all your dice once |
| **Called Shot** | pierce 2 (ignore 2 of the defender's shields) |
| **Parry** | this defense, ignore 2 of the attacker's skulls |
| **Riposte** | if you block **all** hits, deal 1 wound back |
| **Overextend** | roll double attack dice; you roll **0** defense until your next turn |
| **Rally Shield** | an adjacent ally lends you +1 defense die |
| **(Monster) Frenzy** | the monster's attack this turn is +2 attack dice |
| **(Monster) Terrify** | target defends with 1 fewer die |

Existing deck cards to rework: `SpellBook +N` / `Boots` stay (action/move
buffs); combat‑adjacent ones like *Distraction*, *Crush Forward*, *Empowered*
map cleanly to "move a combatant" / "+dice" effects.

---

## 9. Reworked character abilities

Old combat clauses translated to the pool system (drop all "goes second"):

| Character | Old | New |
|-----------|-----|-----|
| **Paladin** | "+1 to minions", tanky | High **D**, **HP**; +1 attack die vs minions; the party's wall |
| **Barbarian** | "+2 to minions; minions do −1; +2 life on minion kill" | High **A**, **1 auto‑skull vs minions**; +1 D vs minions; heal 2 on a minion kill; **Charge**: +1 A if he moved 3+ then attacked |
| **Hunter** | pet; "pet dies in any combat with monster" | Ranged **A** at range 2; pet = own small block (A1/D1/HP=move roll), can't fight the monster |
| **Scout** | "roll 4 to avoid death in building" | Low combat, high evasion: may **Flee** with 0 shields once/turn |
| **Wizard** | "−2 every roll; goes second" | Frail: **A1 / D1**; leans on spell cards |
| **Enchantress** | "1 die for combat; −1; goes second" | **A1 / D1**; control via cards, not fists |
| **Thief** | "−4 all combat; initiate through a wall" | **Ranged assassin**: attacks ignore walls for LoS; good **A**, poor **D** |
| **Ranger** | "initiate 3 away; +1 if >1 space" | **Reach 3**; +1 attack die when attacking from 2+ spaces away |
| **Druid (forms)** | BEAR "+2 combat, −1 from minions"; DEER "+4 from attacks"; TURTLE; CHEETAH | **BEAR**: +1 A & +1 D; **TURTLE**: +2 D, −2 reach; **CHEETAH**: +move, −1 D; **DEER**: heal aura, −1 D (fragile) |
| **Cleric** | "1 die; −4 combat; goes second" | Support: **A1**, decent **D**, heals; not a fighter |

Monsters (they attack; heroes only repel them):

| Monster | Combat identity |
|---------|-----------------|
| **Maraurn'Zol** (Fire) | Highest **A**; "attacks around her through all objects" = ignores cover |
| **The Fog** (Smoke) | Attacks **through building walls**; wide reach |
| **Ghathag** (Claw) | Melee bruiser; obstacles give it cover / block hero LoS |
| **Oblex** (Flesh) | Weak itself; **minions do the fighting** (its buffs add minion attack dice/reach) |
| **Wyht** (Mind) | Low direct **A**; wins via discard/relocate, not blows |

Minion baseline: **A2 / D1 / HP = summon roll**. Oblex "minion combat +1" =
+1 minion attack die.

---

## 10. Ways to make it more interesting

- **Cover**: defending adjacent to a wall/obstacle → +1 defense die. Buildings matter.
- **Flanking**: attacking a target that's also adjacent to your ally → +1 attack die. Rewards teamwork.
- **Charge**: moved 3+ then attacked → +1 attack die (melee).
- **Focus fire**: minions can gang a hero; several small attacks force defense‑card decisions.
- **Riposte / parry cards**: defense can bite back, so attacking isn't free.
- **Wound tokens** (optional): a wounded fighter rolls 1 fewer attack die until healed — momentum matters.
- **Monster "tells"**: monster's attack range grows with objectives collected (already in the ◆ ladder) — tension rises as heroes near victory.
- **Terrain pushes**: repel/knockback can shove a fighter into a wall (extra wound) or out a door.

---

## 11. How it maps to the app

- **Schema**: add `combat: { attack, defense }` to heroes/monsters (HP = existing
  `life`); minion/pet defaults in code. Authorable in the Designer.
- **Combat die**: the first **custom die** — a d6 with ☠/🛡/▢ faces (emoji now,
  icon art later), rendered in the 3D tray.
- **Resolver**: an **Attack** action on a target → both pools roll in the tray →
  net wounds auto‑applied to HP (reuses `adjustHp`), pushes for repel, all logged
  and synced through the existing reducer. Cards inject dice/rerolls/pierce.
- Everything stays offline‑first and multiplayer‑synced like the rest.

---

## 12. Decisions I need from you

- **A. Hero → monster:** repel/push (recommended) · a "stagger" meter that skips
  its next action · or heroes simply can't attack the monster.
- **B. Disengage:** free move away (recommended, keeps it snappy) · or a single
  "parting blow."
- **C. Escape:** fold into the defense die (recommended) · or keep the old ☼ roll.
- **D. Flat bonuses:** allow auto‑skull/auto‑shield on heavy fighters
  (recommended) · or keep it pure dice pools.
- **E. Starting numbers:** want me to fill a full A/D/HP table for all 10 heroes +
  5 monsters + minions to playtest, or keep it abstract for now?
