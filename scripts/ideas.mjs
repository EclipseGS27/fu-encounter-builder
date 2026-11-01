import { BOOK_IDEAS } from './ideas-books.mjs';

/**
 * Suggestions for the creature creator: what the books print for each Species (ideas-books.mjs), and homebrew
 * ideas of our own. Homebrew is always labeled and listed apart from the books, so nobody mistakes it for an
 * official option.
 */

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => {
	const a = [...list];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
};

/** [name, range, attribute, attribute, damage type, effect] */
const HOMEBREW_ATTACKS = {
	beast: [
		['Gnashing Fangs', 'melee', 'dex', 'mig', 'physical', ''],
		['Pounce', 'melee', 'dex', 'dex', 'physical', 'Then the target suffers slow.'],
		['Spitting Quills', 'ranged', 'dex', 'ins', 'physical', ''],
	],
	construct: [
		['Piston Fist', 'melee', 'mig', 'mig', 'physical', ''],
		['Arc Discharge', 'ranged', 'dex', 'ins', 'bolt', 'Then the target suffers dazed.'],
		['Rivet Volley', 'ranged', 'dex', 'ins', 'physical', ''],
	],
	demon: [
		['Brimstone Claw', 'melee', 'dex', 'mig', 'fire', ''],
		['Whispered Hex', 'ranged', 'ins', 'wlp', 'dark', 'Then the target suffers shaken.'],
		['Barbed Tail', 'melee', 'dex', 'mig', 'physical', 'Then the target suffers poisoned.'],
	],
	elemental: [
		['Cinder Lash', 'melee', 'dex', 'wlp', 'fire', ''],
		['Hailstone Burst', 'ranged', 'ins', 'wlp', 'ice', ''],
		['Gale Slice', 'ranged', 'dex', 'ins', 'air', ''],
	],
	humanoid: [
		['Sword Slash', 'melee', 'dex', 'mig', 'physical', ''],
		['Crossbow Bolt', 'ranged', 'dex', 'ins', 'physical', ''],
		['Shield Bash', 'melee', 'mig', 'mig', 'physical', 'Then the target suffers dazed.'],
	],
	monster: [
		['Crushing Grip', 'melee', 'mig', 'mig', 'physical', ''],
		['Acid Spray', 'ranged', 'dex', 'ins', 'poison', ''],
		['Horn Charge', 'melee', 'dex', 'mig', 'physical', 'Then the target suffers slow.'],
	],
	plant: [
		['Thorn Whip', 'melee', 'dex', 'mig', 'physical', ''],
		['Spore Cloud', 'ranged', 'ins', 'wlp', 'poison', 'Then the target suffers poisoned.'],
		['Root Snare', 'melee', 'mig', 'wlp', 'earth', 'Then the target suffers slow.'],
	],
	undead: [
		['Grave Touch', 'melee', 'dex', 'wlp', 'dark', 'Then the target suffers weak.'],
		['Bone Shard', 'ranged', 'dex', 'ins', 'physical', ''],
		['Wailing Scream', 'ranged', 'ins', 'wlp', 'dark', 'Then the target suffers shaken.'],
	],
};

/** [name, text]: special rules of our own, for any Species */
const HOMEBREW_SKILLS = [
	['Pack Tactics', 'This creature gains a +2 bonus to Accuracy Checks against a target that one of its allies attacked since the end of this creature’s last turn.'],
	['Retaliate', 'After an enemy hits this creature with a melee attack, this creature may deal 5 damage of its attack’s type to that enemy.'],
	['Second Wind', 'The first time each conflict this creature is reduced to Crisis, it recovers 10 Hit Points (20 from level 30).'],
	['Bodyguard', 'When an ally on the scene is targeted by an attack, this creature may become the target instead, as long as it is not suffering from slow.'],
	['Telegraphed Strike', 'This creature may spend its turn winding up; at the start of its next turn it performs a free attack that deals 10 extra damage. Enemies who see it wind up may Guard or move away.'],
	['Shifting Hide', 'At the end of each round, this creature replaces one of its Resistances with Resistance to the damage type it suffered most this round.'],
	['Cowardly', 'When this creature is in Crisis and no allies are on the scene, it tries to Escape on its next turn.'],
	['Mana Leech', 'After this creature deals damage to an enemy, that enemy loses 5 Mind Points and this creature recovers the same amount.'],
];

/** Homebrew Role Skills: same shape as the Bestiary's, marked homebrew */
export const HOMEBREW_ROLE_SKILLS = {
	brute: [
		{ id: 'hb-brute-cleave', name: 'Cleave', text: 'When this NPC reduces an enemy to 0 Hit Points with a melee attack, it may perform a free basic attack against another enemy.', homebrew: true },
		{ id: 'hb-brute-unstoppable', name: 'Unstoppable', text: 'This NPC cannot suffer slow while it is not in Crisis.', homebrew: true },
	],
	hunter: [
		{ id: 'hb-hunter-mark', name: 'Hunter’s Mark', text: 'At the start of each round, this NPC marks one enemy it can see. Its attacks against the marked enemy deal 5 extra damage.', homebrew: true },
		{ id: 'hb-hunter-vanish', name: 'Vanish', text: 'After this NPC misses with an attack, it becomes hidden until the start of its next turn: it cannot be targeted by attacks from enemies more than one step away.', homebrew: true },
	],
	mage: [
		{ id: 'hb-mage-overcharge', name: 'Overcharge', text: 'When this NPC casts an offensive spell, it may spend 10 extra Mind Points to have that spell deal 10 extra damage.', homebrew: true },
		{ id: 'hb-mage-ward', name: 'Arcane Ward', text: 'The first time each round this NPC would suffer damage from a spell, that damage is reduced by 10.', homebrew: true },
	],
	saboteur: [
		{ id: 'hb-sab-spread', name: 'Spreading Malady', text: 'When an enemy suffering from a status effect is reduced to 0 Hit Points, another enemy of this NPC’s choice suffers that status effect.', homebrew: true },
		{ id: 'hb-sab-dirty', name: 'Dirty Trick', text: 'Once per round, after an enemy performs a Guard action, this NPC may have them suffer dazed.', homebrew: true },
	],
	sentinel: [
		{ id: 'hb-sent-bulwark', name: 'Bulwark', text: 'Allies adjacent to this NPC gain a +2 bonus to Defense.', homebrew: true },
		{ id: 'hb-sent-challenge', name: 'Challenge', text: 'At the start of the conflict, this NPC challenges one enemy: that enemy treats every other target as having +2 Defense until this NPC is defeated.', homebrew: true },
	],
	support: [
		{ id: 'hb-sup-rally', name: 'Rally', text: 'Once per conflict, this NPC may use an action to have every ally on the scene recover 20 Hit Points and one status effect.', homebrew: true },
		{ id: 'hb-sup-link', name: 'Life Link', text: 'When an ally of this NPC would be reduced to 0 Hit Points, this NPC may lose 20 Hit Points to have that ally remain at 1 Hit Point instead.', homebrew: true },
	],
};

/** Homebrew Species options for Quick Assembly: [name, text] */
export const HOMEBREW_SPECIES_OPTIONS = {
	beast: [['Keen Senses', 'Cannot be surprised, and gains +2 to Opposed Checks to find hidden creatures.'], ['Thick Hide', '+2 Defense while not in Crisis.']],
	construct: [['Overclock', 'Once per conflict, takes an extra turn after its own, then suffers slow.'], ['Self-Repair', 'At the end of each round, recovers 5 Hit Points (10 from level 30).']],
	demon: [['Infernal Pact', 'When an ally is reduced to 0 Hit Points, this creature recovers 10 Mind Points.'], ['Cursed Blood', 'After an enemy hits it with a melee attack, that enemy suffers weak.']],
	elemental: [['Elemental Aura', 'Enemies who hit it with a melee attack suffer 5 damage of its main element.'], ['Volatile', 'When reduced to 0 Hit Points, deals 10 damage of its element to every creature next to it.']],
	humanoid: [['Trained', '+1 to Accuracy Checks with basic attacks.'], ['Tactician', 'Once per round, an ally may use this creature’s Initiative to act right after it.']],
	monster: [['Aberrant Shape', 'Immune to one status effect of your choice and Vulnerable to one damage type.'], ['Terrifying', 'At the start of the conflict, each enemy with lower level than this creature suffers shaken.']],
	plant: [['Rooted', 'Cannot be moved against its will and gains +2 Defense, but cannot leave its position.'], ['Photosynthesis', 'In sunlight, recovers 10 Hit Points at the start of its turn.']],
	undead: [['Deathless', 'The first time it is reduced to 0 Hit Points in a conflict, it returns with 10 Hit Points at the end of the round unless dealt light damage.'], ['Chilling Presence', 'Enemies next to it cannot recover Hit Points.']],
};

/** Basic attacks for a Species: { book, homebrew }, each [name, range, attr, attr, type, effect, source] */
export function attackIdeas(species) {
	return {
		book: BOOK_IDEAS[species]?.attacks ?? [],
		homebrew: (HOMEBREW_ATTACKS[species] ?? []).map((a) => [...a, 'Homebrew']),
	};
}

/** An attack object from an idea, keeping the attack's current HR */
export function attackFrom(idea, hr = 5) {
	const [name, range, a0, a1, type, effect, source] = idea;
	return { name, range, attrs: [a0, a1], type, hr, effect: effect || '', source: source || '' };
}

/** A random book attack for a Species: melee or ranged if asked, never one already used */
export function randomAttack(species, { range = null, not = [], plain = false } = {}) {
	const used = new Set(not.map((n) => String(n).toLowerCase()));
	const { book, homebrew } = attackIdeas(species);
	let list = (book.length ? book : homebrew).filter((a) => (!range || a[1] === range) && !used.has(a[0].toLowerCase()));
	// plain: no effect, so it costs no Special Attack Skill (when there are any)
	if (plain && list.some((a) => !a[5])) list = list.filter((a) => !a[5]);
	return list.length ? pick(list) : null;
}

/** Special rules: { book, homebrew }, each [name, text, source] */
export function skillIdeas(species) {
	return {
		book: BOOK_IDEAS[species]?.rules ?? [],
		homebrew: HOMEBREW_SKILLS.map((s) => [...s, 'Homebrew']),
	};
}

/** Traits seen on this Species in the books, the most common first */
export const traitIdeas = (species) => BOOK_IDEAS[species]?.traits ?? [];

/** Four traits for a Species: mostly common ones, with a rarer one for color */
export function randomTraits(species, n = 4) {
	const all = traitIdeas(species);
	if (!all.length) return [];
	const common = shuffle(all.slice(0, 25));
	const rare = shuffle(all.slice(25));
	const out = [...common.slice(0, n - 1), ...(rare.length ? rare.slice(0, 1) : common.slice(n - 1, n))];
	return out.slice(0, n);
}
