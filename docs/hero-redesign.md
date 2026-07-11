# Heroes — redesign & tuning

Companion to `docs/combat-redesign.md` and `docs/monster-redesign.md`. This pass
rewrites the 10 heroes to fit the systems we actually run now — the attack/
defense **dice pools**, **Flee**, **square sight/reach**, the **objective
ladder** — and drops every legacy clause that no longer means anything
("−N to every combat roll", "always goes second", "roll ☼ to escape"). The
thematic bonuses are **wired into the combat resolver**, not just printed.

---

## 1. Stat table (⚔ attack / 🛡 defense / reach / ❤ life)

Combat die: 3☠ / 2🛡 / 1▢ → 0.5 skull & 0.33 shield per die. Heroes win by
objectives; they can't kill the monster (a hit *repels* it).

| Hero (color) | ⚔ | 🛡 | reach | ❤ | Identity & wired perks |
|---|:-:|:-:|:-:|:-:|---|
| **Paladin** (RED) | 2 | **3** | 1 | 8 | Guardian. **+1🛡 base** · adjacent allies **+1🛡 (aura)** · **riposte 1** · +1⚔ vs minions |
| **Barbarian** (RED) | **4** | 2 | 1 | 8 | Bloodlust: **+2⚔ at ≤ half life** · +1⚔ vs minions · **heal 2 on a minion kill** |
| **Hunter** (YELLOW) | 3 | 1 | **2** | 6 | Pack tactics: reach 2 · **+1⚔ flanking** · **pet** (hero-side piece) |
| **Scout** (YELLOW) | 2 | 2 | 1 | 5 | Recon: **sight 8** · **Flee even on 0 shields** once/turn |
| **Wizard** (BLUE) | 1 | 1 | **2** | 4 | Arcane: reach 2 · **pierce 1** · **+2⚔ at 5◆** (scales) |
| **Enchantress** (BLUE) | 1 | 1 | 1 | 5 | Hexweaver: **hex −1⚔ on anything she hits** · move monster/ally |
| **Thief** (GREEN) | **4** | 1 | 1 | 5 | Backstab: **ignores walls** · **pierce 1** · **+1⚔ flanking** · diagonal |
| **Ranger** (GREEN) | 3 | 2 | **3** | 6 | Sharpshooter: reach 3 · **+1⚔ from 2+ away** · diagonal |
| **Druid** (PURPLE) | 2 | 2 | 1 | 6 | Shapeshifter (forms below) |
| **Cleric** (PURPLE) | 1 | **3** | 1 | 6 | Blessed: **+1🛡 base** · strong support |

Druid forms (combat pool via `FORM_COMBAT` + `FORM_PERKS`): **BEAR** +1⚔/+1🛡 &
takes 1 fewer die from minions · **TURTLE** +2🛡 & **riposte 1** · **CHEETAH**
−1🛡 (fast, fragile; +2 move is manual) · **DEER** −1🛡 (fragile healer).

Sanity: Barbarian ⚔4 vs a minion = **⚔5** ≈ 2.5 skulls — minions melt. Ranger at
range = ⚔4. Thief ⚔4 through a wall is a real threat from cover. The casters
(⚔1/🛡1) genuinely need their cards and their allies.

---

## 2. What's wired into the resolver (not just text)

All read off the character's `combat` block in `GameLogic` COMBAT:

| Field | Effect |
|---|---|
| `baseShield` / `baseAttack` | flat shields/skulls that always land (Paladin, Cleric +1🛡) |
| `attackLadder` | attack dice climb with objectives (Wizard: +2 at 5◆) |
| `vsMinionAttack` | +attack dice when the **target is a minion** (Paladin, Barbarian) |
| `vsMinionDefense` | +defense dice when the **attacker is a minion** ("minions do less"; BEAR form) |
| `rangedAttack` / `rangedFrom` | +attack dice when attacking from **> rangedFrom** spaces (Ranger) |
| `flanking` | +attack dice when the **target is pinned by another piece on your side** (Hunter, Thief) |
| `lowLifeAttack` | +attack dice while the attacker is at **≤ half life** (Barbarian) |
| `pierce` | attacker **ignores that many of the defender's shields** (Wizard, Thief) |
| `riposte` | if the **defender blocks every skull**, it deals that many wounds back (Paladin, TURTLE) |
| `auraAllyDefense` | a living ally beside the defender lends **+defense dice** (Paladin) |
| `hexOnHit` | anything this attacker hits gets **−attack dice until end of turn** (Enchantress) |
| `healOnMinionKill` | attacker regains life when its strike **destroys a minion** (Barbarian) |
| `ignoreCoverAttack` | attacks **ignore walls** for line of sight — drawn by the inspector (Thief) |

These auto-apply in the exchange and show as perk chips on the hero sheet + notes
in the combat readout. Barriers count as minions for the vs-minion bonuses
(martial heroes smash them); the clone does not. The length of each dice pool is
floored at 0, so a hex can't drive it negative. Flanking/aura read piece
positions from the synced state; **wall-based cover is deliberately not wired**
(the reducer doesn't see the board's walls — that stays a manual/table call).

---

## 3. Hunter's pet — a real hero-side piece

Minions gained a **`side`** (`monster` default, or `hero`). A pet is a hero-side
minion (⚔1 / 🛡1 / ❤3):

- **Summon** from the Hunter's sheet (🐾 button); it drops next to the Hunter.
- It fights the **monster side** (minions/clones/barriers) and the monster side
  fights it — `enemiesOf` is now decided by side, not kind.
- Rules kept as text (manual, cardboard-friendly): it **shares the Hunter's
  movement rolls**, flies over obstacles (not walls), and is **destroyed if it
  ever fights the monster itself**.
- Oblex's swarm buffs are guarded so they **never leak** onto a pet, a barrier,
  or a clone — only Oblex's own minions.

---

## 4. Escape / abilities cleanup

- Every "roll ☼ ≥ N to escape or take −5" and "always goes second" / "−N to
  combat" clause is **gone**. Escape is the unified **Flee** (roll Defense;
  shields block *and* scramble you toward cover; break line of sight = safe).
  **Scout** is the specialist — may Flee even on **0 shields** once per turn.
- "Initiate combat N away" → **reach** (Hunter 2, Ranger 3). "Through a wall" →
  **ignoreCoverAttack** (Thief). "+N to minions" → **vsMinion** dice.
- The `4◆ Gain ֍` / `7◆ Gain ☼` ladder lines are the **bonus-die unlocks** the
  app already grants (BM at 4◆, BA at 7◆); the ladder display lights them up
  with the live objective count. Utility abilities (transform, heal, relocate a
  door/objective, walk through walls, summon) stay as authored text — played by
  hand, exactly as the cardboard game would.
