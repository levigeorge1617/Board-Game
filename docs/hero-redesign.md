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

Combat pools are **doubled** from the original redesign so a fight throws a
meatier fistful of dice (a lone die felt limp); health scales with them so the
exchange math is unchanged, just bigger.

| Hero (color) | ⚔ | 🛡 | reach | ❤ | Identity (lean keyword set) |
|---|:-:|:-:|:-:|:-:|---|
| **Paladin** (RED) | 4 | **6** | 1 | 16 | The wall. **+2🛡 base** · heavy (**+1 flee**) |
| **Barbarian** (RED) | **7** | 4 | 1 | 16 | Bruiser. ⚔7 up close · punished at range |
| **Hunter** (YELLOW) | 5 | 2 | **2** | 12 | Marksman: reach 2 · **pet** (hero-side piece) |
| **Scout** (YELLOW) | 4 | 4 | 1 | 10 | Nimble: **−1 flee** (slips away) |
| **Wizard** (BLUE) | 3 | 2 | **2** | 8 | Caster: reach 2, frail, card-driven |
| **Enchantress** (BLUE) | 3 | 2 | 1 | 10 | Controller: move monster/ally, walk walls |
| **Thief** (GREEN) | **7** | 2 | 1 | 10 | Assassin: ⚔7 · **−1 flee** · diagonal |
| **Ranger** (GREEN) | 5 | 4 | **3** | 12 | Sharpshooter: reach 3 · **+2⚔ from 2+ away** · diagonal |
| **Druid** (PURPLE) | 4 | 4 | 1 | 12 | Shapeshifter (forms below) |
| **Cleric** (PURPLE) | 3 | **6** | 1 | 12 | Blessed: **+2🛡 base** · heavy (**+1 flee**) |

Druid forms (combat pool via `FORM_COMBAT`, shown on the sheet): **BEAR** +2⚔/+2🛡 ·
**TURTLE** +4🛡 · **CHEETAH** −2🛡 (fast, fragile; +2 move manual) · **DEER** −2🛡
(fragile healer).

Diversity now comes from **reach + numbers + flee ease + utility**, not a pile of
keywords. Two systemic rules do the heavy lifting: reach-gated counters (below)
make the Ranger safe and the Barbarian vulnerable at range, and flee thresholds
give every hero a different escape feel.

---

## 2. The lean keyword set (wired in the resolver)

Cover and flanking were **dropped** ("too much adjustment to combat"), along with
pierce / riposte / hex / aura / bloodlust / vs-minion / heal-on-kill. What's left:

| Field | Effect |
|---|---|
| `attack` / `defense` / `reach` | the three core numbers every fighter has |
| `baseShield` / `baseAttack` | flat shields/skulls that always land (Paladin, Cleric +2🛡) |
| `rangedAttack` / `rangedFrom` | +attack dice when striking from **> rangedFrom** spaces (Ranger +2) |
| `fleeMod` | shifts this fighter's flee threshold (hero) or a foe's (monster) |

Two systemic rules (no keyword, always on):

- **Reach gates the counter-blow.** In an exchange the defender only deals its
  skulls back if the attacker is within the *defender's* reach. Melee struck from
  range can't retaliate; a long-reach attacker strikes safely; a monster whose
  reach outgrows yours can't be pushed away.
- **Flee threshold.** A hero defender may flee if its Defense roll shows
  `≥ 3 + heroFleeMod + monsterFleeMod` shields, clamped to `[1, its max shields]`
  so flight is always at least possible. Tracked & shown on every combat.
  Scout/Thief −1, Paladin/Cleric +1; Oblex +1, Wyht −1. (Sim: nimble/frail heroes
  ~33–56%, bruisers ~11%, tanks ~26% — but tanks rarely need to run.)

Heroes ignore line of sight entirely — only reach limits their attacks. Only the
monster uses sight (for grid-roll attacks). Dice-pool length is floored at 0.

---

## 3. Hunter's pet — a real hero-side piece

Minions gained a **`side`** (`monster` default, or `hero`). A pet is a hero-side
minion (⚔2 / 🛡2 / ❤6):

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
  combat" clause is **gone**. Escape is **Flee**: your Defense roll's shields both
  block and, if they meet the flee threshold, let you slip away. Scout/Thief flee
  easiest; heavy heroes hardest.
- "Initiate combat N away" → **reach** (Hunter 2, Ranger 3). The reach-gated
  counter rule replaces per-hero "melee vs ranged" keywords.
- The universal objective rewards (a card at 2/5/6, bonus ֍ at 4, bonus ☼ at 7)
  are a **rulebook rule**, not printed on each hero card any more — the cards now
  show only what's unique. Utility abilities (transform, heal, relocate a
  door/objective, walk through walls, summon) stay as authored text — played by
  hand, exactly as the cardboard game would.
