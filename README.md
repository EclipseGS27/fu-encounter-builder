# Fabula Ultima Encounter Builder

Build encounters for the Project FU system (Foundry v13, Project FU 4.14+) from every NPC you have: the world's own and every Actor compendium (Project FU's NPCs, any Bestiary or Atlas pack, your homebrew). See how hard the fight is, let it suggest one, save it, and put it on the scene in one click.

## Install
In Foundry: Add-on Modules → Install Module → paste this Manifest URL:
`https://github.com/EclipseGS27/fu-encounter-builder/releases/latest/download/module.json`
Requires Foundry v13 and the Project FU system. GM only.

## Open it
- The dragon button in the Token controls, **Shift+E**, or **Encounter Builder** at the top of the Actors sidebar.

## What it does
- **Party**: heroes and Party Level are read from the active Party. Party Level is the **highest** hero's level, as the Core Rulebook defines it. **Allies** who take their own full turns count as extra heroes. Change any number by hand; ⟳ reads the party again.
- **Two methods**, with a toggle and a short note on each, both straight from the books:
  - **Core Rulebook**: count soldiers: an elite counts as 2, a champion X as X. **Easy** is one fewer than the heroes, **Normal** as many, **Hard** one more (most boss battles should be hard). Each foe's level is marked against the Party Level: below it is probably too weak, within 5 appropriate, within 10 a significant threat, 11+ probably too strong.
  - **Bestiary**: the same count, read as enemy turns per round. Creatures are built for about four heroes with foes within 5 levels, so a foe further off gets the Bestiary's quick level adjustment (HP, Crisis, MP, Checks, damage and Skills to change). It also checks the **role** mix (brute, hunter, mage, saboteur, sentinel, support): every foe the same role, more than one support soldier, and soldier mages with no sentinel. It suggests Easy or Normal for groups of two or three heroes, and Hard fights rather than higher levels for groups above four.
- **Difficulty meter**: Trivial, Easy, Normal, Hard or Above hard, with the counts for your party. Notes for lone champions (often better as Normal than Hard), bosses that should be Villains, and the Ultima Points each Villain gets (minor 5, major 10, supreme 15).
- **Every creature in the books**: a built-in index of the 246 stat blocks in the Core Rulebook, Bestiary vol. 1 and the High, Natural and Techno Fantasy Atlases (book, level, rank, Species, role). It is matched to your NPCs by name (within 5 levels), so the builder knows each creature's book and Bestiary role even when the compendium doesn't say.
- **Creatures from every book**: search by name, species or traits; filter by book, rank, Bestiary role, Villains only, and "within 5 levels of the party". Click to add, right-click to open the sheet. Each foe in the encounter has − / + for how many, and what it counts as.
- **Suggest**: pick Easy, Normal or Hard and it builds a random encounter with exactly that count from the creatures shown on the right (filters steer it: one book, undead only, and so on). It prefers foes near the Party Level, and with the Bestiary method a mix of roles and at most one support soldier. Hard fights are often built around an elite or a champion.
- **Saved encounters**: save, load and delete encounters for later sessions.
- **Place on scene**: compendium creatures are imported once into an "Encounter Builder" folder (and reused after that), then placed as hostile tokens in a staggered line to the right of the middle of your view, numbered when there are several of the same (Goblin 1, Goblin 2). Optionally hidden, and optionally added to the combat (a new one is made if there is none).

## Create a creature
The second tab builds a new NPC by the books and makes it a Project FU actor (in a "Created Creatures" folder), optionally adding it straight to the encounter. A toggle switches between the two methods, with a note on each:
- **Core Rulebook** ("Designing NPCs"): level 5–60, Species (with its starting Skills and rules applied), an Attribute array (Jack of All Trades, Standard, Specialized, Super Specialized) assigned to DEX/INS/MIG/WLP, a die size up at levels 20, 40 and 60, any number of basic attacks, and the 17 NPC Skills with a budget that counts the Species, one per 10 levels, one per extra Vulnerability (two for physical) and the rank. Improved Hit Points, Initiative, Defenses, Specialized and Spellcaster apply their numbers; Spellcaster unlocks the NPC Spells.
- **Bestiary** ("Quick Assembly"): level 5 or a multiple of 10 and one of the six roles, which set Attributes, HP, MP, defenses and attacks by level. Then the role's customization (soldiers and elites), Role Skills (one each at 20, 40 and 60, one for elites, X for champions X; some only for certain ranks), a Boss Skill for champions (all seven groups), the Quick Assembly Species options, an optional Negative Skill for one more Skill, and the role's spells.
- Both: name, art, rank (elite, champion 2–6), Villain (with Ultima Points), four Traits, Affinities (click to cycle) and status immunities, notes. A live stat block shows HP, MP, Crisis, Initiative, DEF/M.DEF, turns per round, Accuracy and damage bonuses, attacks, spells and Skills, plus anything still missing (skills over budget, Vulnerabilities a role needs, Species choices left).
- The actor gets its level, Species, rank, role, Attributes, Affinities, immunities, HP/MP (through Project FU's own formulas), defense, Accuracy, Magic and damage bonuses, Ultima Points, basic attacks, NPC spells, and each Skill as a special rule with a short summary. Class spells (Ignis, Heal...) that the mage and support lists allow are added from the compendium afterwards.

## Changing the numbers
The encounter rules are in `scripts/rules.mjs`, the creature index in `scripts/books.mjs`, and the creation rules in `scripts/creation-data.mjs` (Skill texts there are short summaries; the books have the full wording). The API is at `game.modules.get('fu-encounter-builder').api` (`open()`, `rules`).
