# Fabula Ultima Encounter Builder

Build encounters for the Project FU system (Foundry v13, Project FU 4.14+) from every NPC you have: the world's own and every Actor compendium (Project FU's NPCs, any Bestiary or Atlas pack, your homebrew). See how hard the fight is, let it suggest one, save it, and put it on the scene in one click.

## Install
In Foundry: Add-on Modules → Install Module → paste this Manifest URL:
`https://github.com/EclipseGS27/fu-encounter-builder/releases/latest/download/module.json`
Requires Foundry v13 and the Project FU system. GM only.

## Open it
- The dragon button in the Token controls, **Shift+E**, or **Encounter Builder** at the top of the Actors sidebar.

## What it does
- **Party**: heroes and level are read from the active Party (its characters' average level), or from the player characters. Change either number by hand; ⟳ reads the party again.
- **Two ways to weigh a fight**, with a toggle and a short note on each:
  - **Core Rulebook**: counts soldier-equivalents against the number of heroes. A soldier is 1, an elite 2, a champion as many soldiers as it replaces. As many as the heroes is a fair fight; one more is a hard boss battle (most bosses should be); fewer is easier.
  - **Bestiary**: the same rank weights, scaled by each foe's level next to the party's (half from 10 or more levels below, ¾ from 5 below, 1½ from 5 above, double from 10 above), against a budget per hero. A few strong foes and a crowd of weak ones can come out equally hard.
- **Difficulty meter**: Trivial, Easy, Balanced, Hard or Deadly, with where each one starts for your party. Warnings for foes 10+ levels above or below the party, and the Ultima Points each villain should get (minor 5, major 10, supreme 15).
- **Creatures from every book**: search by name, species or traits; filter by book (compendium, and its top folder when the pack is split by book), rank, villains only, and "near the party's level" (±5). Click to add, right-click to open the sheet. Each foe in the encounter has − / + for how many, and what it counts as.
- **Suggest**: pick Easy, Balanced, Hard or Deadly and it builds a random encounter close to that from the creatures shown on the right (so filters steer it: one book, undead only, and so on). Hard and Deadly fights are often built around an elite or a champion.
- **Saved encounters**: save, load and delete encounters for later sessions.
- **Place on scene**: compendium creatures are imported once into an "Encounter Builder" folder (and reused after that), then placed as hostile tokens in a staggered line to the right of the middle of your view, numbered when there are several of the same (Goblin 1, Goblin 2). Optionally hidden, and optionally added to the combat (a new one is made if there is none).

## Changing the numbers
Every number for both methods is in `scripts/rules.mjs` (rank weights, the Bestiary level factors and budgets per hero), so it can be matched to your book or your table. The API is at `game.modules.get('fu-encounter-builder').api` (`open()`, `rules`).
