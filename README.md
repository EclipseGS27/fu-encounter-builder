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

## Changing the numbers
The rules are in `scripts/rules.mjs` and the creature index in `scripts/books.mjs`. The API is at `game.modules.get('fu-encounter-builder').api` (`open()`, `rules`).
