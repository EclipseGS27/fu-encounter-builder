/**
 * Creature creation rules, as data. Numbers follow the Core Rulebook ("Designing NPCs", NPC Species, NPC Skills,
 * NPC Spells) and Bestiary vol. 1 ("Quick Assembly"). Descriptions are short summaries for the builder; the books
 * have the full wording.
 *
 * fx: what the builder applies by itself (hp, mp, init, def, mdef, acc, magic bonuses; spells to pick).
 */

export const DAMAGE_TYPES = ['physical', 'air', 'bolt', 'dark', 'earth', 'fire', 'ice', 'light', 'poison'];
export const STATUSES = ['dazed', 'enraged', 'poisoned', 'shaken', 'slow', 'weak'];
export const ATTRS = ['dex', 'ins', 'mig', 'wlp'];
export const ATTR_LABEL = { dex: 'DEX', ins: 'INS', mig: 'MIG', wlp: 'WLP' };
export const SPECIES = ['beast', 'construct', 'demon', 'elemental', 'humanoid', 'monster', 'plant', 'undead'];
/** Affinity values as Project FU stores them */
export const AFF = { VU: -1, '': 0, RS: 1, IM: 2, AB: 3 };

/* ------------------------------------------------------------------ */
/*  Core Rulebook                                                      */
/* ------------------------------------------------------------------ */

export const CORE_ARRAYS = {
	jack: { label: 'Jack of All Trades (d8, d8, d8, d8)', dice: [8, 8, 8, 8] },
	standard: { label: 'Standard (d10, d8, d8, d6)', dice: [10, 8, 8, 6] },
	specialized: { label: 'Specialized (d10, d10, d6, d6)', dice: [10, 10, 6, 6] },
	super: { label: 'Super Specialized (d12, d8, d6, d6)', dice: [12, 8, 6, 6] },
};

/** Starting Skills and what each Species does by itself */
export const CORE_SPECIES = {
	beast: { skills: 4, note: 'Can’t take Use Equipment.' },
	construct: { skills: 2, aff: { poison: 'IM', earth: 'RS' }, immune: ['poisoned'], note: 'Immune to poison, Resistant to earth, immune to poisoned.' },
	demon: { skills: 3, note: 'Resistant to two damage types of your choice (set them in Affinities).', choose: { RS: 2 } },
	elemental: { skills: 2, aff: { poison: 'IM' }, immune: ['poisoned'], note: 'Immune to poison and to one more damage type of your choice, immune to poisoned.', choose: { IM: 1 } },
	humanoid: { skills: 3, equipment: true, note: 'Gets Use Equipment for free.' },
	monster: { skills: 4, note: 'No special rules.' },
	plant: { skills: 3, immune: ['dazed', 'shaken', 'enraged'], note: 'Immune to dazed, shaken and enraged; Vulnerable to one of air, bolt, fire or ice.', choose: { VU: 1, from: ['air', 'bolt', 'fire', 'ice'] } },
	undead: { skills: 2, aff: { dark: 'IM', poison: 'IM', light: 'VU' }, immune: ['poisoned'], note: 'Immune to dark and poison, immune to poisoned, Vulnerable to light. Healing can hurt them.' },
};

/** NPC Skills. limited: once only; max: how many times */
export const CORE_SKILLS = [
	{ id: 'crisis', name: 'Crisis Effect', kind: 'rule', text: 'While in Crisis, gains a strong benefit: new Affinities, damage that ignores Resistances, multi on an attack…' },
	{ id: 'absorb', name: 'Damage Absorption', kind: 'rule', text: 'Absorbs one damage type it already Resists or is Immune to.', aff: 'AB' },
	{ id: 'immune', name: 'Damage Immunity', kind: 'rule', text: 'Immune to one damage type it isn’t Vulnerable to.', aff: 'IM' },
	{ id: 'resist', name: 'Damage Resistance', kind: 'rule', text: 'Resistant to two damage types (or drops a Species Vulnerability).', aff: 'RS', count: 2 },
	{ id: 'final', name: 'Final Act', limited: true, kind: 'rule', text: 'Does something when reduced to 0 HP: explodes, curses, calls for help. Damage should be minor.' },
	{ id: 'flying', name: 'Flying', limited: true, kind: 'rule', text: 'Flies: melee attacks can’t reach it unless the attacker can. Forced to land by damage it is Vulnerable to; loses this in Crisis.' },
	{ id: 'impdmg', name: 'Improved Damage', kind: 'rule', text: 'One attack or spell deals 5 extra damage (a different one each time).' },
	{ id: 'impdef', name: 'Improved Defenses', max: 2, kind: 'rule', text: '+2 Defense and +1 Magic Defense, or +1 and +2.', fx: { def: 2, mdef: 1 }, alt: { def: 1, mdef: 2 } },
	{ id: 'imphp', name: 'Improved Hit Points', kind: 'none', text: '+10 maximum HP.', fx: { hp: 10 } },
	{ id: 'impinit', name: 'Improved Initiative', limited: true, kind: 'none', text: '+4 Initiative.', fx: { init: 4 } },
	{ id: 'reaction', name: 'Reaction', kind: 'rule', text: 'Reacts to a trigger: attacks back when missed, deals minor damage when hit by a spell, swaps Affinities…' },
	{ id: 'special', name: 'Special Attack', kind: 'attack', text: 'Adds an effect to one attack: multi (2), targets M.DEF, a status, trapping, draining HP…' },
	{ id: 'specialized', name: 'Specialized', max: 3, kind: 'none', text: '+3 to Accuracy Checks, Magic Checks, or Opposed Checks in one context.', fx: { acc: 3 }, alt: { magic: 3 } },
	{ id: 'spellcaster', name: 'Spellcaster', kind: 'spells', text: 'Learns two spells, or one spell and +10 MP.', fx: { spells: 2 }, alt: { spells: 1, mp: 10 } },
	{ id: 'statusimm', name: 'Status Effect Immunity', kind: 'rule', text: 'Immune to two status effects.', status: 2 },
	{ id: 'unique', name: 'Unique Action', kind: 'skill', text: 'An action of its own: power up the next attack, change stance, call weak reinforcements…' },
	{ id: 'equipment', name: 'Use Equipment', limited: true, kind: 'none', text: 'Gets accessory, armor, main hand and off-hand slots.' },
];

/** NPC Spells: mp, target, duration, offensive, damage (HR + n, or flat) */
export const NPC_SPELLS = [
	{ id: 'area-status', name: 'Area Status', mp: 20, target: 'Special', duration: 'instantaneous', text: 'Every enemy it can see suffers one status (dazed, shaken, slow or weak).' },
	{ id: 'breath', name: 'Breath', mp: 5, target: 'One creature', offensive: true, hr: 10, text: '(HR + 10) damage of a chosen type.' },
	{ id: 'curse', name: 'Curse', mp: 5, target: 'One creature', offensive: true, text: 'The target suffers one status (dazed, shaken, slow or weak).' },
	{ id: 'curse-xl', name: 'Curse XL', mp: 10, target: 'One creature', offensive: true, text: 'The target suffers two statuses (dazed, shaken, slow, weak).' },
	{ id: 'cursed-breath', name: 'Cursed Breath', mp: 10, target: 'One creature', offensive: true, hr: 15, text: '(HR + 15) damage of a chosen type, then a status.' },
	{ id: 'devastation', name: 'Devastation', mp: 30, target: 'Special', offensive: false, flat: 30, minLevel: 30, text: '30 damage of a chosen type to every enemy it can see. For elites and champions level 30+, on their last turn.' },
	{ id: 'lick-wounds', name: 'Lick Wounds', mp: 5, target: 'Self', text: 'Recovers 20 HP (30 at level 20+, 40 at 40+, 50 at 60).' },
	{ id: 'life-theft', name: 'Life Theft', mp: 10, target: 'One creature', offensive: true, hr: 15, text: '(HR + 15) damage, then recovers half the HP lost.' },
	{ id: 'mind-theft', name: 'Mind Theft', mp: 10, target: 'One creature', offensive: true, hr: 15, text: '(HR + 15) damage, then recovers MP equal to half the HP lost.' },
	{ id: 'poison', name: 'Poison', mp: 10, perTarget: true, target: 'Up to three creatures', offensive: true, text: 'Each target hit suffers poisoned.' },
	{ id: 'quicken', name: 'Quicken', mp: 20, target: 'One creature', text: 'The target performs a free attack.' },
	{ id: 'rage', name: 'Rage', mp: 10, perTarget: true, target: 'Up to three creatures', offensive: true, text: 'Each target hit suffers enraged.' },
	{ id: 'shell', name: 'Shell', mp: 10, target: 'Self', duration: 'scene', text: 'Resistant to physical damage for the scene.' },
	{ id: 'war-cry', name: 'War Cry', mp: 10, perTarget: true, target: 'Up to three creatures', duration: 'scene', text: '+1 to Accuracy Checks for the scene.' },
	{ id: 'weaken', name: 'Weaken', mp: 10, target: 'One creature', offensive: true, duration: 'scene', text: 'Sources of a chosen damage type deal 5 extra damage to the target for the scene.' },
];

/* ------------------------------------------------------------------ */
/*  Bestiary: Quick Assembly                                           */
/* ------------------------------------------------------------------ */

export const QA_LEVELS = [5, 10, 20, 30, 40, 50, 60];

/** One row per level: [level, dex, ins, mig, wlp, hp, mp] (Accuracy +level/10, extra damage by tier) */
const T = (rows) => rows.map(([level, dex, ins, mig, wlp, hp, mp]) => ({ level, dex, ins, mig, wlp, hp, mp }));

/** A Role Skill: name, summary, rank requirement ('elite+', 'champion', 'soldier/elite'), fx */
const S = (name, text, extra = {}) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, text, ...extra });

export const ROLES = {
	brute: {
		label: 'Brute',
		blurb: 'Lots of HP, low defenses, strong attacks. Multiple Vulnerabilities; weak to poisoned and weak.',
		def: 0,
		mdef: 0,
		vulns: 2,
		stats: T([[5, 8, 6, 10, 8, 70, 45], [10, 8, 6, 10, 8, 80, 50], [20, 8, 8, 10, 8, 100, 60], [30, 8, 8, 10, 8, 120, 70], [40, 8, 8, 12, 8, 150, 80], [50, 8, 8, 12, 8, 180, 90], [60, 8, 8, 12, 10, 200, 110]]),
		attacks: [
			{ name: 'Normal Attack', range: 'melee', attrs: ['dex', 'mig'], hr: 5, multi: 2, choose: true },
			{ name: 'Strong Attack', range: 'melee', attrs: ['mig', 'mig'], hr: 10 },
		],
		custom: [
			S('Bad Temper', 'In Crisis: immune to every status but enraged, or normal attack deals 5 extra damage.'),
			S('Collateral Damage', 'A successful Hinder also deals 10 damage (20 from level 30).'),
			S('Die Hard', 'The first time it drops to 0 HP in a scene, it stays at 1 HP.'),
			S('Special Armor', 'Out of Crisis, reduces damage from attacks, spells or Skills (choose one) by 5.'),
			S('Vengeful Attack', 'When an enemy drops it to 0 HP, it strikes that enemy back with strong attack (HR 0).'),
		],
		skills: [
			S('Status Immunity', 'Immune to two of poisoned, shaken, slow.'),
			S('Mind Strike', 'Normal attack targets Magic Defense.'),
			S('Ranged Strong Attack', 'Strong attack becomes ranged (DEX + MIG) and inflicts dazed, shaken, slow or weak.'),
			S('Collapse', 'Missing with strong attack fills a 6-section Collapse Clock; when full, everyone takes minor damage.', { rank: 'elite+' }),
			S('Brute Spells', 'Learns two of Area Status, Curse XL, Cursed Breath, Enrage, Lick Wounds, Life Theft, Poison, Reinforce.', { rank: 'elite+', fx: { spells: 2 }, spellList: ['area-status', 'curse-xl', 'cursed-breath', 'lick-wounds', 'life-theft', 'poison'] }),
			S('Crush', 'Unique action: enemies it envelops (hit by strong attack) lose 20 HP (30 from level 30).'),
			S('Enhancing Guard', 'After Guarding, its next attack deals 5 extra damage that ignores Resistances.'),
			S('Sore Loser', 'When it fails an Opposed Check and the enemy moved a Clock by 2+, that enemy suffers a status.'),
			S('Steady Recovery', 'At the end of its turn, with three or more statuses, it recovers from all of them.'),
		],
		perLevel: { 10: 'Resistance to two damage types.', 20: 'role', 30: 'Immunity to one damage type.', 40: 'role', 50: '+10 max HP (included).', 60: 'role' },
	},
	hunter: {
		label: 'Hunter',
		blurb: 'Very accurate single-target attacks and a good Defense. Weak to enraged and slow.',
		def: 0,
		mdef: 0,
		vulns: 1,
		stats: T([[5, 10, 8, 8, 6, 50, 35], [10, 10, 8, 8, 6, 60, 40], [20, 10, 8, 8, 8, 80, 60], [30, 10, 8, 8, 8, 100, 70], [40, 12, 8, 8, 8, 120, 80], [50, 12, 8, 8, 8, 140, 90], [60, 12, 10, 8, 8, 160, 100]]),
		attacks: [{ name: 'Normal Attack', range: 'melee', attrs: ['dex', 'ins'], hr: 10, note: 'Heals half the HP it takes, or deals 5 extra damage against enemies in a chosen state.' }],
		custom: [
			S('Emergency Camouflage', 'The first time it enters Crisis, it turns invisible until its next turn.'),
			S('False Sense of Security', 'When an ally fails an Opposed Check or misses everyone, its next Check gets +3.'),
			S('Lightning Fast', 'Deals 5 extra damage on other creatures’ turns, unless it has a status.'),
			S('Special Resistance', 'Resistant to all damage from sources hitting exactly one creature (or two or more).'),
		],
		skills: [
			S('Mind Strike', 'Normal attack targets Magic Defense.'),
			S('Strong Attack', 'Adds a (HR + 15) multi (2) strong attack; after it, the hunter can’t act until the end of its next turn.', { attack: { name: 'Strong Attack', range: 'melee', attrs: ['dex', 'ins'], hr: 15, multi: 2 } }),
			S('Piercing Strong Attack', 'Strong attack (if any) targets Magic Defense.'),
			S('Hunter Spells', 'Learns two of Breath, Cursed Breath, Lick Wounds, Life Theft, Mirror.', { fx: { spells: 2 }, spellList: ['breath', 'cursed-breath', 'lick-wounds', 'life-theft'] }),
			S('Ambush', 'In the first round of a conflict, DEX, INS or WLP (choose) counts one die size higher.'),
			S('Elusive', 'While it has no status effects, damage deals nothing to it.'),
			S('Hunter’s Bait', 'When an enemy’s attack or spell against it has an even Result, it attacks back (HR 0).'),
			S('Opportunist', 'Opposed Checks against dazed or slow enemies crit on doubles.'),
			S('Target Lock', 'Guarding locks onto a random enemy: its next normal attack must target them and deals 10 extra damage.'),
		],
		perLevel: { 10: '+3 to Accuracy Checks.', 20: 'role', 30: 'In Crisis, normal attack ignores Resistances.', 40: 'role', 50: 'Resistance to two damage types.', 60: 'role' },
		levelFx: { 10: { acc: 3 } },
	},
	mage: {
		label: 'Mage',
		blurb: 'Spells, often on several targets. The most damage, but fragile.',
		def: 1,
		mdef: 2,
		vulns: 1,
		stats: T([[5, 8, 8, 6, 10, 40, 55], [10, 8, 8, 6, 10, 50, 60], [20, 8, 10, 6, 10, 70, 70], [30, 8, 10, 6, 10, 90, 80], [40, 8, 10, 6, 12, 110, 100], [50, 8, 10, 6, 12, 130, 110], [60, 8, 10, 8, 12, 160, 120]]),
		attacks: [{ name: 'Normal Attack', range: 'ranged', attrs: ['ins', 'wlp'], hr: 5 }],
		spells: { count: 2, alt: { count: 1, mp: 10 }, list: ['breath', 'cursed-breath'], classSpells: 'Boulder, Flare, Fulgur, Glacies, Iceberg, Ignis, Lux, Omega, Terra, Thunderbolt, Umbra, Ventus, Vortex (class spells; Boulder, Flare, Iceberg, Thunderbolt and Vortex from level 30)' },
		custom: [
			S('Collateral Damage', 'A successful Hinder also deals 10 damage (20 from level 30).'),
			S('Overwhelm', 'Opposed Checks against shaken or weak enemies crit on doubles.'),
			S('Soulburst', 'When it Surrenders or leaves, everyone else recovers a heavy amount of MP.'),
		],
		customAlt: 'Immunity to one damage type.',
		skills: [
			S('Status Immunity', 'Immune to two of dazed, enraged, poisoned, shaken.'),
			S('Elemental Resistance', 'Resistant to two damage types other than physical.'),
			S('Mana Strike', 'Normal attack restores 10 MP to it (20 from level 30).'),
			S('Volatile', 'Enemies it hurts with normal attack become volatile: damage to them ignores Resistances until healed.'),
			S('Mage Spells', 'Learns two (or one and +10 MP) of Cursed Breath, Devastation, Drain Spirit, Flare, Iceberg, Life Theft, Mind Theft, Omega, Thunderbolt.', { fx: { spells: 2 }, spellList: ['cursed-breath', 'devastation', 'life-theft', 'mind-theft'] }),
			S('Element Drain', 'Typed damage (not physical or poison) it suffers restores half as much MP.'),
			S('Element Shift', 'Casting an elemental spell makes it Absorb that type and become Vulnerable to its opposite.'),
			S('Magical Mastery', 'Winning a magical Opposed Check moves a Clock one extra section.'),
		],
		perLevel: { 10: 'Normal attack targets Magic Defense.', 20: 'role', 30: 'Immunity to one damage type.', 40: 'role', 50: '+3 to Magic Checks.', 60: 'role' },
		levelFx: { 50: { magic: 3 } },
	},
	saboteur: {
		label: 'Saboteur',
		blurb: 'Weakens the heroes with statuses, MP loss and denied actions. Light damage, decent defenses.',
		def: 2,
		mdef: 1,
		vulns: 1,
		stats: T([[5, 8, 8, 8, 8, 50, 45], [10, 8, 8, 8, 8, 60, 50], [20, 8, 8, 8, 10, 80, 70], [30, 8, 8, 8, 10, 100, 80], [40, 8, 10, 8, 10, 120, 90], [50, 8, 10, 8, 10, 140, 100], [60, 10, 10, 8, 10, 160, 110]]),
		attacks: [{ name: 'Normal Attack', range: 'melee', attrs: ['dex', 'ins'], hr: 5, note: 'Targets hit lose a minor amount of MP, lose 1 IP, or suffer a status (enraged or poisoned add a Vulnerability).' }],
		custom: [
			S('Aura of Unease', 'Enemies can’t recover from two chosen statuses while it is here.'),
			S('Entangle', 'Enemies with two or more statuses can’t perform free attacks while it is here.'),
			S('Exhausting Compromise', 'When it fails an Opposed Check against an enemy with 2+ statuses, it can spend 20 MP to move a Clock.'),
			S('Hindering Specialist', 'Once per turn, a successful Hinder lets it Hinder again for free.'),
			S('Syphon Mind', 'While it is here, every enemy MP cost is 5 higher.'),
		],
		skills: [
			S('Double Strike', 'Normal attack gains multi (2).'),
			S('Mind Strike', 'Normal attack targets Magic Defense.'),
			S('Strong Attack', 'Adds a (HR + 5) strong attack that denies one or two things (healing, an action type, seeing it…) until the target’s next turn.', { attack: { name: 'Strong Attack', range: 'melee', attrs: ['dex', 'ins'], hr: 5 } }),
			S('Piercing Strong Attack', 'Strong attack (if any) targets Magic Defense.'),
			S('Saboteur Spell', 'Learns one of Area Status, Curse XL, Dispel, Drain Spirit, Poison, Rage, Stop, Weaken, and +10 MP.', { fx: { spells: 1, mp: 10 }, spellList: ['area-status', 'curse-xl', 'poison', 'rage', 'weaken'] }),
			S('Cruel Hypnosis', 'Unique action, 20 MP: a dazed, enraged or shaken enemy attacks a target it picks.', { rank: 'elite+' }),
			S('Parting Gift', 'When it falls or leaves, enemies under its Weaken lose a minor amount of HP.', { rank: 'soldier/elite' }),
			S('Secret Technique', 'One attack or spell can be used without anyone but the target noticing.'),
			S('Shadow of Doubt', 'Heroes with two or more statuses can’t invoke Traits or Bonds while it is here.'),
		],
		perLevel: { 10: '+3 to Accuracy or Magic Checks.', 20: 'role', 30: 'Out of Crisis, normal attack ignores Resistances.', 40: 'role', 50: 'Immunity to one damage type.', 60: 'role' },
		levelFx: { 10: { acc: 3 } },
	},
	sentinel: {
		label: 'Sentinel',
		blurb: 'Protects its allies and soaks blows: good defenses, statuses on hit.',
		def: 2,
		mdef: 1,
		vulns: 2,
		stats: T([[5, 8, 8, 8, 8, 50, 45], [10, 8, 8, 8, 8, 60, 50], [20, 8, 8, 10, 8, 90, 60], [30, 8, 8, 10, 8, 110, 70], [40, 8, 8, 10, 10, 130, 90], [50, 8, 8, 10, 10, 150, 100], [60, 10, 8, 10, 10, 170, 110]]),
		attacks: [
			{ name: 'Normal Attack', range: 'melee', attrs: ['dex', 'mig'], hr: 5, note: 'Targets hit suffer one status: dazed, shaken, slow or weak.' },
			{ name: 'Strong Attack', range: 'melee', attrs: ['dex', 'mig'], hr: 10 },
		],
		custom: [
			S('Intercept', 'Like the Guardian’s Protect, unlimited, for one ally chosen at the start of the conflict.'),
			S('Threaten', 'Enemies must include it in their attacks and offensive spells, until it takes damage it is Vulnerable to.'),
			S('Vulnerability Block', 'While it is here, one Vulnerability of an elite or champion ally becomes a Resistance.'),
			S('Unwavering Support', 'Villain allies can invoke its Traits with Ultima Points; those rerolls crit on doubles.'),
		],
		skills: [
			S('Resistances', 'Resistant to two damage types.'),
			S('Double Strike', 'Normal attack gains multi (2).', { rank: 'elite+' }),
			S('Piercing Blows', 'Normal attack damage ignores Resistances.'),
			S('Dispelling Strike', 'Strong attack ends Scene spells on targets with a chosen status.'),
			S('Sentinel Spell', 'Learns one of Breath, Lick Wounds, Shell, War Cry, and +10 MP.', { fx: { spells: 1, mp: 10 }, spellList: ['breath', 'lick-wounds', 'shell', 'war-cry'] }),
			S('Barricade', 'Unique action, 10 MP: it and its allies Resist one or two damage types until it takes damage it is Vulnerable to.'),
			S('Reassuring Aura', 'Allies who see or hear it are immune to one status.'),
			S('Reduce Progress', 'Enemies moving a Clock by 2+ move it one less, unless it has certain statuses.'),
			S('Retaliation', 'When an enemy hits it or an ally, it strikes back with strong attack (HR 0).', { rank: 'elite+' }),
		],
		perLevel: { 10: 'Resistance to two damage types other than physical.', 20: 'role', 30: '+2 Defense, +1 Magic Defense.', 40: 'role', 50: 'Immune to two of poisoned, shaken, weak.', 60: 'role' },
		levelFx: { 30: { def: 2, mdef: 1 } },
	},
	support: {
		label: 'Support',
		blurb: 'Heals, buffs and coordinates its allies. Usually one per conflict.',
		def: 0,
		mdef: 0,
		vulns: 1,
		stats: T([[5, 8, 8, 6, 10, 50, 55], [10, 8, 8, 6, 10, 60, 60], [20, 8, 10, 6, 10, 80, 70], [30, 8, 10, 6, 10, 100, 80], [40, 8, 10, 8, 10, 130, 90], [50, 8, 10, 8, 10, 150, 100], [60, 8, 12, 8, 10, 170, 110]]),
		attacks: [{ name: 'Normal Attack', range: 'ranged', attrs: ['ins', 'wlp'], hr: 5 }],
		spells: { count: 2, alt: { count: 1, mp: 10 }, list: ['quicken', 'war-cry'], classSpells: 'Aura, Awaken, Barrier, Cleanse, Divination, Elemental Shroud, Heal, Mirror, Reinforce, Soul Shroud (class spells)' },
		custom: [
			S('Advise', 'Unique action, 10 MP: an ally recovers from dazed and shaken and gets +3 on their next Check.'),
			S('Inspire', 'Unique action, 10 MP: an ally recovers a minor amount of HP or MP and raises one Attribute a die size until their next turn.'),
			S('Vulnerability Block', 'While it is here, one Vulnerability of an elite or champion ally becomes a Resistance.'),
		],
		skills: [
			S('Double Strike', 'Normal attack gains multi (2).'),
			S('Mind Strike', 'Normal attack targets Magic Defense.'),
			S('Hindering Strike', 'Normal attack inflicts a status, or restores 10 MP to it (20 from level 30).'),
			S('Advise and Inspire', 'Gains both Advise and Inspire, and one more Vulnerability.', { rank: 'champion' }),
			S('Better Advice', 'Advise also cures every status.'),
			S('Strategic Command', 'Unique action, 10 MP: an ally acts right after it and deals 10 extra damage the first time.'),
			S('Follow-up Attack', 'Once per turn, when an ally under its Scene spell hits, it attacks too (HR 0).'),
			S('Healing Aura', 'At the end of its turns, every ally recovers a minor amount of HP.'),
			S('MP Battery', 'Can pay its allies’ MP costs for them.'),
			S('One Last Command', 'When it falls or leaves, it uses Advise, Inspire or Strategic Command for free.'),
		],
		perLevel: { 10: 'Resistance to two damage types other than physical.', 20: 'role', 30: '+1 Defense, +2 Magic Defense.', 40: 'role', 50: 'Immunity to one damage type other than physical.', 60: 'role' },
		levelFx: { 30: { def: 1, mdef: 2 } },
	},
};

/** Boss Skills, by group */
export const BOSS_SKILLS = {
	Battlefield: [
		S('Aura of Suffering', 'Nobody can recover from (or be immune to) one chosen status.'),
		S('Life and Death', 'Odd rounds: everyone deals 5 extra damage. Even rounds: healing restores 10 more.'),
		S('Near and Far', 'Melee can’t target anyone on odd rounds and/or ranged can’t on even rounds.'),
		S('Zombification', 'Others who heal while weak (or poisoned) lose half as much HP instead.'),
	],
	Control: [
		S('Auto-Counter', 'When an enemy makes it lose HP, it counters with normal attack or a cheap spell (HR 0).'),
		S('Crisis Status', 'Entering Crisis inflicts one or two statuses on every enemy.'),
		S('Mark of Shared Pain', 'Enemies hit become marked; its HP loss is shared with marked enemies.'),
		S('Observe and Punish', 'The last enemy to provoke it gets a stronger attack and a status each round.'),
		S('Tyrant’s Decree', 'Each round it forbids an action type at random and punishes whoever uses it.'),
		S('You Just Proved My Point', 'Each round one Trait type is secretly risky: invoking it fumbles.', { ultima: false }),
	],
	Destructive: [
		S('Catastrophe Charger', 'Drains 30 MP from each soldier ally every round; at 100 it blasts every enemy.'),
		S('Corrosive Status', 'Last turn each round: damage to every enemy with a chosen status.'),
		S('Destructive Formation', 'Last turn each round, with 2+ soldier allies: damage to every enemy.'),
		S('Devastation', 'Learns Devastation.', { minLevel: 30, spell: 'devastation' }),
		S('Doom', 'Fills a 6-section Doom Clock each round (2 in Crisis); when full, every enemy drops to 1 HP.'),
		S('Hellish Gamble', 'Even rounds, 20 MP: heavy damage to a random creature, itself included.'),
		S('Nihilo', 'Even rounds, 10 MP: ends every Scene spell, ongoing effect, Arcanum and symbol.'),
	],
	Elemental: [
		S('Binary Elements', 'Immune to one of each chosen pair (air/earth, dark/light, fire/ice) and Vulnerable to the other; swaps every round.'),
		S('Elemental Crisis', 'Entering Crisis changes its Affinities and damage types.'),
		S('Elemental Stance', 'Switches between 2–5 elemental stances on a trigger, each Immune to one type and Vulnerable to its opposite.'),
	],
	Objective: [
		S('Attrition', 'When it fails an Opposed Check, that enemy suffers a status (or loses HP or MP).'),
		S('Countdown', 'A 6-section Countdown Clock fills each round; when full, it wins.'),
		S('Cruel Twist', 'Once per scene, 2 Ultima Points: swaps the progress of two Clocks.', { ultima: true }),
		S('Crushing Advantage', 'An action and 20 MP fill or erase 2 sections of a Clock in its field of expertise.'),
		S('I Know You Well', '1 Ultima Point: invokes a hero’s Trait to reroll; that Trait becomes strained.', { ultima: true }),
		S('Ruinous Influence', '2 Ultima Points: every enemy in an Opposed Check fumbles.', { ultima: true }),
	],
	Summoner: [
		S('Call Reinforcements', '1 Ultima Point: summons up to two soldiers.', { ultima: true }),
		S('Counter-Summoning', 'Each turn it lost HP, it summons a soldier.'),
		S('Emergency Reinforcements', 'In Crisis with fewer than two soldiers, one joins each round.'),
		S('Part Regeneration', 'Entering Crisis cures its side and summons back lost parts.'),
		S('Perfect Coordination', 'Its soldiers can spend its Ultima Points to reroll.', { ultima: true }),
	],
	Survival: [
		S('Adaptive Affinities', 'Becomes Immune to the last damage type that hurt it.'),
		S('Camouflage', 'On even rounds: invisible, or can’t be targeted by melee, or by spells and ranged attacks.'),
		S('Catch Me If You Can', 'A Pursuit Clock: enemies can’t see it until it is half full.'),
		S('Defensive Stance', 'Halves damage from attacks on odd rounds, from everything else on even rounds.'),
		S('Regeneration', 'In Crisis, recovers a heavy amount of HP and/or MP each round.'),
		S('Second Wind', 'Entering Crisis cures all statuses and restores a massive amount of MP.'),
		S('Temporary Defenses', 'Defense or Magic Defense fixed at 12 + level/20 until Crisis; then normal attack gains multi.'),
		S('Undo', '1 Ultima Point at 0 HP: everyone recovers a massive amount of HP and MP.', { ultima: true }),
		S('Vampiric Formation', 'With 2+ soldier allies, heals half the HP it makes enemies lose.'),
	],
};

/** Negative Skills: a drawback that pays for one more Role or Boss Skill */
export const NEGATIVE_SKILLS = [
	S('Final Delay', 'When it falls or leaves, erases a section of a Clock that helps its side.'),
	S('Final Detonation', 'When it falls or leaves, deals heavy damage to each of its allies.'),
	S('Final Restore', 'When it falls or leaves, every enemy recovers a heavy amount of HP or MP.'),
	S('Final Status', 'When it falls or leaves, each ally suffers a status.'),
	S('Final Weakening', 'When it falls or leaves, its champion becomes Vulnerable to a type until the end of the round.'),
	S('Forced Landing', 'Using its strong attack grounds it until the end of the round.'),
	S('Painful Miss', 'Missing everyone with an attack makes it or a random ally lose a minor amount of HP.'),
	S('Status Bind', 'Each of dazed, shaken, slow, weak blocks one of its attacks or actions; no immunity to them.'),
];

/** Species in Quick Assembly: what they add, and how many options to pick */
export const QA_SPECIES = {
	beast: { picks: 2, options: ['+10 max HP', 'Spell: Lick Wounds, Shell or War Cry (+10 MP)', '+3 to Opposed Checks using its instincts', 'Flying', 'One more Role Skill', 'One more Role Skill (second)'] },
	construct: { aff: { earth: 'RS', poison: 'IM' }, immune: ['poisoned'], optVuln: ['air', 'bolt', 'fire', 'ice'], picks: 0, picksIfVuln: 1, options: ['Immune to two statuses', '+3 to Opposed Checks using its design', 'Flying', 'One more Role Skill'] },
	demon: { choose: { RS: 2 }, picks: 1, options: ['One Resistance becomes an Absorption', 'Spell: Breath, Curse XL, Mind Theft or Weaken (+10 MP)', 'Flying', 'One more Role Skill'] },
	elemental: { aff: { poison: 'IM' }, immune: ['poisoned'], choose: { IM: 1 }, optVuln: DAMAGE_TYPES.filter((t) => t !== 'poison'), picks: 0, picksIfVuln: 1, options: ['One Immunity becomes an Absorption', 'Spell: Breath, Cursed Breath or Lick Wounds (+10 MP)', 'Flying', 'One more Role Skill'] },
	humanoid: { choose: { VU: 1, from: ['dark', 'light', 'physical', 'poison'] }, picks: 3, options: ['Resistance to two types other than physical', 'Spell: Lick Wounds, Shell or War Cry (+10 MP)', '+3 to Opposed Checks from its training', 'Flying', 'One more Role Skill', 'One more Role Skill (second)'] },
	monster: { picks: 2, options: ['+10 max HP', 'Resistance to two types other than physical', 'Spell: Breath, Cursed Breath or Lick Wounds (+10 MP)', 'Flying', 'One more Role Skill', 'One more Role Skill (second)'] },
	plant: { choose: { VU: 1, from: ['air', 'bolt', 'fire', 'ice'] }, immune: ['dazed', 'enraged', 'shaken'], picks: 1, options: ['Resistance to two types other than physical', 'Spell: Breath, Cursed Breath, Life Theft or Poison (+10 MP)', 'Thorns: 5 damage to melee attackers (10 from level 30)', 'Flying', 'One more Role Skill'] },
	undead: { aff: { light: 'VU', dark: 'IM', poison: 'IM' }, immune: ['poisoned'], optVuln: ['air', 'bolt', 'earth', 'fire', 'ice'], picks: 0, picksIfVuln: 1, options: ['Dark Immunity becomes an Absorption', 'Spell: Breath, Curse, Life Theft or Poison (+10 MP)', 'Flying', 'One more Role Skill'] },
};
