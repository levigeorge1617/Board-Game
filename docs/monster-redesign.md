# Monsters, movement & escape — redesign

Companion to `docs/combat-redesign.md` (the attack/defense dice pool). This pass
tunes the **five monsters**, formalizes the **two ways monsters move**, and
reworks **escape** so line of sight — not a lonely dice roll — decides safety.
Everything here is human-executable at a real table (see §6, cardboard mapping)
and, where the app helps, is surfaced in the character sheet (see §7).

---

## 1. The two ways a monster moves

A monster's turn has **two distinct movement modes**, and they feel opposite on
purpose:

| Mode | How | Feel | Damage |
|------|-----|------|--------|
| **Advance** (dice/steps) | Roll the movement die (or take fixed steps) and *walk*. Controlled positioning. | Weak, deliberate. | Only a normal adjacent Strike (one exchange), which a hero can Flee. |
| **Rampage** (random grid) | Roll the **grid** (column + row) and *crash down* on that square. | Sudden, dangerous. | **Strikes every hero in line of sight of the landing** — the big hit. |

The core tension the user asked for: **the random move hurts, the walk is
weak.** Heroes near the monster live and die by whether they're caught in line of
sight when it Rampages.

**More objectives → more Rampages.** The base turn is **1 Rampage + 1 Advance**.
Each monster gains **+1 Rampage per `rampageEvery` objectives** collected
(Maraurn'Zol/Ghathag every 4, Wyht every 3). Tension climbs exactly as the
heroes near their win.

Not every monster teleport-Rampages — each has a signature move (`moveStyle`):

- **rampage** (Maraurn'Zol) — grid-crash meteors.
- **blink** (Wyht) — short grid-hops to set up tricks; a passed hero takes a small Strike.
- **creep** (The Fog) — never teleports; rolls a big movement die and slides forward, faster late.
- **stalk** (Ghathag) — steps forward toward the nearest hero; sight collapses to 1 while charging.
- **swap** (Oblex) — walks, then trades places with any of its minions.

---

## 2. Escape, engagement & the anti-loop rule

The old escape (roll `☼ ≥ N`, else −5 life) was a disjointed side-system and
combat could ping-pong forever. Replaced by three interlocking rules:

### 2a. Attacking costs an action
Every *deliberate* attack — hero → monster/minion, monster's Advance Strike,
minion → hero — **costs the attacker 1 action (`☼`)**. You cannot attack more
times than you have actions, so a turn *cannot* contain an infinite exchange.
(A Rampage's line-of-sight Strike is the exception: it's the built-in danger of
the random move, one Strike per hero per Rampage, no action spent.)

### 2b. Combat is one exchange, resolved on your turn
Both sides roll their pools **once, simultaneously** (already implemented):
attacker's skulls wound the defender, defender's skulls wound back, shields
block. No "who goes first," no re-roll-until-death. The monster attacks on *its*
turn; heroes on *theirs*. There is no reactive ping-pong.

### 2c. Escape = **Flee**, folded into the Defense pool
When a hero is Struck, they choose **Defend** or **Flee**:

- **Defend** — roll Defense; shields block as normal.
- **Flee** — roll Defense; shields **still block the hit**, *and* each shield
  lets the hero **scramble 1 space** toward cover. If the hero ends **out of the
  attacker's line of sight or reach, they escape** the engagement. 0 shields =
  you took the hit and stayed.
- **Building exit** — fleeing from inside a building, you leave through a door
  and take **−2 life** (unchanged from the classic rule).

This unifies escape onto the **one die pool you already roll**, so it never
feels bolted on, and success is measured in *distance/positioning*, which is
what actually breaks pursuit. Evasive heroes lean on it: e.g. **Scout** may Flee
even on 0 shields once per turn; **Thief/Ranger** flee well via range.

### 2d. Line of sight is the real escape
A monster/minion can only *initiate* on a hero it **can see and reach**. So the
reliable escape is **positional**: get behind a wall, around a corner, or into a
building. This is the fix for the "push it back but it's still in range" loop
(the Fog especially): **don't try to out-shove a monster whose reach outgrows
the push — break line of sight instead.**

---

## 3. Stat blocks (tuned)

Combat die: **3 ☠ / 2 🛡 / 1 ▢** → 0.5 skull & 0.33 shield per die. Monsters
can't be killed (heroes *repel* them 1 space per net skull).

| Monster | ⚔ Atk | 🛡 Def | Reach | 👁 Sight | Move | +Move/obj | Signature |
|---------|:----:|:----:|:----:|:----:|------|:--:|-----------|
| **Maraurn'Zol** (Fire) | **5** | 0 | 1 | 6 | rampage | /4 | meteors ignore all cover; clone; growing AoE |
| **The Fog** (Smoke) | 4 | 0 | 1→3 | 6 | creep (D20+2) | — | buildings are safe; grows range & speed |
| **Ghathag** (Claw) | 4 (+2 charge) | **2** | 1 | 4 (1 stalking) | stalk | /4 | barriers; deadly on the charge; no doors |
| **Oblex** (Flesh) | 2 | 0 | 1 | 4 | swap | — | minions do everything; buffs the swarm |
| **Wyht** (Mind) | 2 | 0 | 1 | 5 | blink | /3 | card/objective disruption, not blows |

Sanity checks (wounds ≈ 0.5·Atk − 0.33·Def):
- Maraurn'Zol 5 vs Wizard D1 ≈ **2.2** (frail heroes must never be caught in a meteor's line);
  vs Paladin D3 ≈ **1.5** (the wall survives several).
- Ghathag charging = **6** dice ≈ 3 − D shields: cornering by him is lethal, but his
  sight is **1 while stalking** — step out of his lane and he whiffs.
- Oblex/Wyht at **2** barely scratch on their own — their pressure is the swarm / the tricks.

---

## 4. The five kits (numbers on the objective ladder)

`x◆` = scales/repeats every turn · `N◆` = usable each turn once N objectives are
collected · `N◇` = one-time trigger at N. Full authored text lives in
`data/monsters.json`; this is the design intent.

### Maraurn'Zol — the meteor storm
- **Rampage = meteor.** Land on the grid roll; Strike **every hero in line of
  sight** of the impact. Strike **ignores all cover** (through objects & walls).
- `x◆` +1 meteor / 4 objectives · `2◆` blast radius 1 · `4◆` radius 2 · `7◆` radius 3.
- `6◇` **Clone** — a second Maraurn'Zol piece that meteors right after her, same radius.
- `9◇` **Meteor Storm** — one extra Rampage; everyone not behind a full wall is Struck.
- *Identity:* highest damage in the game, area denial that snowballs, then doubles via the clone.

### The Fog — the creeping wall
- **Creep**, never teleports: slide forward D20 (+2), faster as objectives fall.
- `1◆` Strike 1 away · `4◆` reach 2 · `8◆` reach 3 · `2◆`/`4◆` +D4 movement each.
- **Buildings are safe** — the Fog can't Strike heroes indoors. That is the loop-breaker.
- `2◇` see through all objects (still not through building walls) · `9◇` Suffocate up to 2 heroes not indoors.
- *Identity:* inevitability. You can't fight it; you route around it and hole up.

### Ghathag — the stalker
- **Stalk** toward the nearest hero; **sight 1 while stalking**; **can't enter buildings.**
- `x◆` +1 Stalk / 4 obj · `2◆` Stalk 3 · `4◆`/`6◆` +3 more each · `3◆` place a 2-life 2×1 barrier.
- **Charge:** moved 3+ then reached a hero → **+2 attack dice**.
- Barriers: `3◇`/`5◇` place 2 · `4◆`/`7◆` barriers +2 life · `9◇` every barrier becomes a minion.
- *Identity:* a patient predator that walls you in, then bursts you down if he closes.
  **Barriers reuse the minion system** (a minion with ⚔0 that blocks line of sight);
  `9◇` simply grants them attack.

### Oblex — the swarm
- Weak itself; **swap places with a minion** after moving. **No extra moves** from objectives.
- `1◆` summon **1 + 1 per 3 objectives** (d4 HP each) · `3◆` instead, +1 attack to a minion · `5◆` minions move 2.
- `1◇`/`3◇`/`5◇` summon 2/3/4 · `4◆`/`7◆` minion attack +1 · `6◆` minion reach +1 · `9◇` **double** the minions.
- *Identity:* death by a thousand cuts; the board fills up and the buffs make each cut bite.

### Wyht — the trickster (retuned to actually threaten)
The old kit (make *one* hero discard *one* card) was too soft against **5 heroes
drawing 5 cards a turn.** Retuned to hit the whole economy and deny tempo:
- `2◆` **relocate any objective** to a space you choose (deny a pending collect).
- `4◆` **every** hero discards 1 — or one hero discards 2 (matches the 5-card draw).
- `6◆` draw 2 monster cards; a chosen hero discards **down to 4** (a real hand-cap).
- `8◆` swap two objectives' positions, or +1 to an objective's value.
- `1◇`/`5◇` add an objective (**raises the goal**) · `3◇` scatter ALL objectives · `10◇` a hero dies.
- Passive: draws an **extra card** whenever she draws.
- *Identity:* she never out-punches you; she rots your hand and moves the finish line.

---

## 5. Why this is balanced around the win condition

Heroes win by **objectives**; they can't kill a monster, only repel it. So every
monster's power is **keyed to the objective count** — the closer the heroes get,
the more Rampages fire, the wider the meteors, the faster the Fog, the bigger the
swarm. The heroes' own clock is the monster's power bar. Escape (breaking line of
sight) is always available, so a caught hero has an *out* that costs tempo, not a
coin-flip death.

---

## 6. Cardboard mapping (this must work in real life)

Nothing here needs a computer:

- **Rampage** = roll two dice for the grid coordinate (column die + row die),
  place the monster there, then look down each of the four orthogonal lines up to
  its Sight number; any hero on a clear line is Struck. (Blast radius = also
  Strike the ring of squares around the impact.)
- **Advance/Creep/Stalk** = roll/step the movement die and slide the piece.
- **Strike** = attacker rolls its Attack pool of combat dice, defender rolls
  Defense, count ☠ vs 🛡, subtract, lose that much life. One roll each.
- **Flee** = the defender rolls Defense instead of standing; shields block AND
  are spaces you slide toward cover; out of line of sight = safe.
- **Barriers** = physical 2×1 tiles with a life die on top; block movement & sight.
- **Clone / minions** = extra monster/minion standees with their own health die.
- **Objective ladder** = a reference card per monster; you already track the
  objective count with a token, so you just read down to the highest unlocked line.

The app mirrors all of this; it is a table aid, not a rules engine.

---

## 7. What the app does now (this pass)

- **`data/monsters.json`** carries the tuned kits, stats, `combat` blocks, plus
  `stats.sight`, `stats.moveStyle`, `stats.rampageEvery` (and `stalkSight`).
  Re-embed with `python3 tools/embed.py` (NOT `convert.py`, which re-imports the
  old CSVs — see the note at its top).
- **Objective-aware ability ladder** (character sheet): every `N◆:/N◇:/x◆:` line
  lights up the moment the live objective count reaches its threshold, and shows
  🔒 until then — so the monster player always sees exactly what's unlocked. ◆
  rows read green (repeatable), ◇ rows gold (one-time).
- **Movement-mode hint** on the monster sheet: names the monster's move style and
  computes how many **Rampages/Blinks** the current objective count grants
  (`1 + ⌊score / rampageEvery⌋`), plus its Sight.
- **Combat** already resolves as a single attack/defense-pool exchange with the
  monster being repelled, not killed (`docs/combat-redesign.md`).

### Not yet automated (deliberately — keep it a manual table aid)
Meteor AoE tiles, clone/minion auto-spawn, Fog growth, barrier placement, and
per-attack action-economy are **played by hand** using the ladder + move hint as
the guide, exactly as the cardboard game would. A future pass could add reducer
helpers (spawn a clone, place a barrier-minion, apply a Rampage line-Strike to
all heroes in sight) if we want more automation.
