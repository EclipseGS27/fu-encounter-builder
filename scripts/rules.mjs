/**
 * Encounter rules, from the books.
 *
 * Core Rulebook (Game Master chapter, "Party level and enemy levels", "Creature ranks", "Boss battles"):
 * - Party Level is the highest level among the Player Characters taking part.
 * - Count soldiers: an elite counts as two soldiers of the same level; a champion X as X soldiers.
 * - Easy battle: soldiers = PCs − 1. Normal: = PCs. Hard: = PCs + 1. Allies who take their own full turns count
 *   as extra PCs. Most boss battles should be hard; lone champions are tough and often work better as normal.
 * - An enemy below the Party Level is probably too weak; within 5 levels, appropriate; within 10, a significant
 *   threat; 11 or more above, probably too strong.
 *
 * Bestiary vol. 1 (Introduction and "Making adjustments"): the same count, read as enemy turns per round against
 * PC turns, with its design assumptions: about four PCs, foes within 5 levels of them (adjust a creature's level
 * rather than leaving it far off), a mix of roles, small or fragile groups kept to easy or normal fights, big or
 * optimized groups given hard fights rather than higher-level foes, and roughly as many fights against a lone
 * champion as against mixed groups.
 */

import { PART_GROUPS } from './books.mjs';

export const DIFFICULTIES = [
	{ id: 'trivial', label: 'Trivial', color: '#8aa0b8' },
	{ id: 'easy', label: 'Easy', color: '#6fe3a0' },
	{ id: 'normal', label: 'Normal', color: '#7cb8ff' },
	{ id: 'hard', label: 'Hard', color: '#f2c45a' },
	{ id: 'over', label: 'Above hard', color: '#ff6b7a' },
];
export const PICKABLE = ['easy', 'normal', 'hard'];

/** How many soldiers (enemy turns per round) a foe counts as */
export function rankWeight(npc) {
	if (npc.rank === 'champion') return Math.max(1, Number(npc.replaced) || 1);
	if (npc.rank === 'elite') return 2;
	return 1;
}

export const RANK_LABEL = { soldier: 'Soldier', elite: 'Elite', champion: 'Champion' };
export const rankText = (npc) => (npc.rank === 'champion' ? `Champion ${Math.max(1, Number(npc.replaced) || 1)}` : (RANK_LABEL[npc.rank] ?? 'Soldier'));
export const ROLES = ['brute', 'hunter', 'mage', 'saboteur', 'sentinel', 'support'];

/** Core Rulebook: what a foe's level means next to the Party Level */
export function levelBand(level, partyLevel) {
	const gap = (Number(level) || 0) - partyLevel;
	if (gap < 0) return { id: 'weak', label: 'Probably too weak', gap };
	if (gap <= 5) return { id: 'fit', label: 'Appropriate', gap };
	if (gap <= 10) return { id: 'threat', label: 'Significant threat', gap };
	return { id: 'strong', label: 'Probably too strong', gap };
}

/* ------------------------------------------------------------------ */
/*  Bestiary: adjusting a creature's level ("Making adjustments")     */
/* ------------------------------------------------------------------ */

const BRACKETS = [5, 10, 20, 30, 40, 50, 60];
const bracketOf = (lv) => {
	let b = 0;
	for (let i = 0; i < BRACKETS.length; i++) if (lv >= BRACKETS[i]) b = i;
	return b;
};

/**
 * The Bestiary's quick level adjustment: Hit Points by twice the difference (Crisis by the difference), Mind Points
 * by the difference (twice for champions), both times the rank multiplier for Hit Points; Accuracy and Magic Checks
 * by one per level bracket crossed (5, 10, 20 ... 60); damage by its tier; one Skill per 10 levels.
 */
export function levelAdjustment(npc, to) {
	const from = Number(npc.level) || 0;
	const d = to - from;
	if (!d) return null;
	const mult = npc.rank === 'elite' ? 2 : npc.rank === 'champion' ? Math.max(1, Number(npc.replaced) || 1) : 1;
	const gap = bracketOf(to) - bracketOf(from);
	// extra damage comes in tiers: +5 from level 20, +10 from 40, +15 at 60
	const tier = (lv) => (lv >= 60 ? 15 : lv >= 40 ? 10 : lv >= 20 ? 5 : 0);
	const dmg = tier(to) - tier(from);
	const s = (n) => (n > 0 ? `+${n}` : `${n}`);
	const parts = [`${s(2 * d * mult)} HP`, `${s(d * mult)} Crisis`, `${s(d * (npc.rank === 'champion' ? 2 : 1))} MP`];
	if (gap) parts.push(`${s(gap)} to Checks`);
	if (dmg) parts.push(`${s(dmg)} damage`);
	if (Math.abs(d) >= 10) parts.push(`${d > 0 ? 'add' : 'remove'} ${Math.trunc(Math.abs(d) / 10)} Skill${Math.abs(d) >= 20 ? 's' : ''}`);
	return `To level ${to}: ${parts.join(', ')}.`;
}

/* ------------------------------------------------------------------ */
/*  The rules                                                          */
/* ------------------------------------------------------------------ */

/**
 * Both books build encounters the same way (the Bestiary reads the Core count as enemy turns per round and adds
 * advice), so there is one method: the Core count and level bands, with the Bestiary's level adjustment for foes
 * further than 5 levels off and its notes on group size and roles.
 */
export const RULES = {
	label: 'Core Rulebook + Bestiary',
	blurb:
		'Count soldiers against the heroes (enemy turns per round against theirs): an elite is 2, a champion X is X. Easy is one fewer than the heroes, Normal as many, Hard one more; most boss fights should be Hard, a lone champion often works better as Normal. Party Level is the highest hero’s level: foes below it are probably too weak, within 5 levels fit, within 10 are a real threat, and 11+ above probably too strong. A foe more than 5 levels off can take the Bestiary’s level adjustment instead. Mix roles, keep small groups to Easy or Normal, and give big ones Hard fights rather than higher levels.',
};

/**
 * @param {{npc:object, qty:number}[]} entries
 * @param {{heroes:number, allies?:number, level:number}} party
 */
export function evaluate(entries, party) {
	const heroes = Math.max(1, (Number(party.heroes) || 1) + (Number(party.allies) || 0));
	const PL = Number(party.level) || 1;
	let total = 0;
	let count = 0;
	const warnings = [];
	const notes = [];
	for (const { npc, qty } of entries) {
		total += rankWeight(npc) * qty;
		count += qty;
	}
	const bands = { easy: heroes - 1, normal: heroes, hard: heroes + 1 };
	let rating = null;
	if (count) rating = total < bands.easy ? 'trivial' : total === bands.easy ? 'easy' : total === bands.normal ? 'normal' : total === bands.hard ? 'hard' : 'over';

	// levels: the Core bands, and the Bestiary's adjustment for anything more than 5 levels off
	for (const { npc } of entries) {
		const b = levelBand(npc.level, PL);
		const fix = Math.abs(b.gap) > 5 ? ` ${levelAdjustment(npc, Math.max(5, Math.min(60, PL + Math.sign(b.gap) * 5)))}` : '';
		if (b.id === 'weak') (fix ? warnings : notes).push(`${npc.name} (Lv ${npc.level}) is below the Party Level: probably too weak.${fix}`);
		if (b.id === 'threat') notes.push(`${npc.name} (Lv ${npc.level}) is ${b.gap} levels above the party: a significant threat.${fix}`);
		if (b.id === 'strong') warnings.push(`${npc.name} (Lv ${npc.level}) is ${b.gap} levels above the party: probably too strong.${fix}`);
	}

	const champs = entries.filter((e) => e.npc.rank === 'champion');
	const lone = entries.length === 1 && champs.length === 1 && entries[0].qty === 1;
	if (lone && rating === 'hard') notes.push('A lone champion is an uphill battle: multi-target effects help less and it never loses turns. It often works better as Normal than Hard.');
	if (rating === 'over') warnings.push(`That is ${total - bands.hard} more than a hard battle. The Bestiary keeps even summoned reinforcements from going past Hard.`);
	if (champs.length && !entries.some((e) => e.npc.villain)) notes.push('A boss should probably be at least a minor Villain, with Ultima Points.');
	for (const e of entries) {
		const v = e.npc.villain;
		if (v) notes.push(`${e.npc.name} is a ${typeof v === 'string' ? `${v} ` : ''}Villain: give them Ultima Points (minor 5, major 10, supreme 15).`);
	}

	const n = Number(party.heroes) || 1;
	if (n < 4 && rating === 'hard') notes.push('Groups of two or three heroes have a harder time: the Bestiary suggests Easy or Normal fights, or fewer enemy turns (a champion 4 becomes a champion 3).');
	if (n > 4 && (rating === 'easy' || rating === 'normal')) notes.push('For groups above four heroes the Bestiary suggests Hard fights rather than higher-level foes.');
	const roles = entries.map((e) => e.npc.role).filter(Boolean);
	const kinds = new Set(roles);
	if (count >= 3 && roles.length >= 2 && kinds.size === 1) warnings.push(`Every known role here is ${[...kinds][0]}: the best conflicts mix roles.`);
	const supportSoldiers = entries.filter((e) => e.npc.role === 'support' && e.npc.rank === 'soldier').reduce((s, e) => s + e.qty, 0);
	if (supportSoldiers > 1) warnings.push('Most conflicts should only include one support soldier, so the fight doesn’t drag on.');
	if (entries.some((e) => e.npc.role === 'mage' && e.npc.rank === 'soldier') && !roles.includes('sentinel') && count >= 3) notes.push('Soldier mages are usually the main source of damage: a sentinel to protect them makes them harder to rush down.');

	const top = Math.max(bands.hard + 2, total, 1);
	return {
		unit: total === 1 ? 'soldier' : 'soldiers',
		total,
		count,
		heroes,
		bands,
		rating,
		meter: { pct: Math.min(100, (total / top) * 100), marks: Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, Math.min(100, (v / top) * 100)])) },
		warnings,
		notes: [...new Set(notes)],
	};
}

/* ------------------------------------------------------------------ */
/*  Encounter shapes                                                   */
/* ------------------------------------------------------------------ */

const isSoldier = (n) => n.rank === 'soldier';
const uniq = (list) => new Set(list.map((c) => c.uuid)).size;

/**
 * Shapes for Suggest, like the encounter templates of Kobold Fight Club and friends, in Fabula Ultima terms.
 * Every shape still hits the exact soldier count for the difficulty. Fields:
 * lead: the first foe must pass this; fill: who fills the rest; count: exactly this many foes;
 * same: chance of repeating a soldier already picked; ok: the finished group must pass this.
 */
export const SHAPES = {
	balanced: { label: 'Balanced', desc: 'Any mix that hits the count: sometimes led by an elite or champion, often a mixed squad.' },
	boss: { label: 'Boss and minions', desc: 'One champion (or an elite, in small fights) leading soldiers. The classic boss fight.', lead: (n) => n.rank === 'champion', leadAlt: (n) => n.rank === 'elite', fill: isSoldier, ok: (c) => c.length >= 2 },
	lone: { label: 'Lone boss', desc: 'A single champion that replaces as many soldiers as the fight needs. Works best as Normal.', lead: (n) => n.rank === 'champion', count: 1 },
	lieutenants: { label: 'Boss and lieutenants', desc: 'A champion with one or more elites at its side, maybe a soldier to round it out.', lead: (n) => n.rank === 'champion', fill: (n) => n.rank !== 'champion', ok: (c) => c.some((x) => x.rank === 'elite') },
	duo: { label: 'Duo', desc: 'Exactly two foes, often a pair that covers each other.', count: 2 },
	trio: { label: 'Trio', desc: 'Exactly three foes, three different creatures.', count: 3, ok: (c) => uniq(c) === 3 },
	elites: { label: 'Elite squad', desc: 'Elites only (one soldier if the count is odd): few foes, each one tough.', fill: (n) => n.rank !== 'champion', ok: (c) => c.filter(isSoldier).length <= 1 && c.some((x) => x.rank === 'elite') },
	pack: { label: 'Pack', desc: 'Several of one soldier: wolves, bandits, a patrol of guards.', fill: isSoldier, same: 1, ok: (c) => uniq(c) === 1 && c.length >= 2 },
	horde: { label: 'Horde', desc: 'Soldiers only, as many as the count allows, of one or two kinds.', fill: isSoldier, same: 0.6, ok: (c) => uniq(c) <= 2 && c.length >= 3 },
	mixed: { label: 'Mixed roles', desc: 'All different creatures with different Bestiary roles, as the Bestiary recommends.', ok: (c) => c.length >= 2 && uniq(c) === c.length && new Set(c.map((x) => x.role).filter(Boolean)).size === c.length },
	guarded: { label: 'Guarded casters', desc: 'A sentinel holding the line in front of a mage or support.', ok: (c) => c.some((x) => x.role === 'sentinel') && c.some((x) => x.role === 'mage' || x.role === 'support') },
	ambush: { label: 'Ambush', desc: 'Hunters and saboteurs: quick, accurate, and full of nasty statuses.', fill: (n) => n.role === 'hunter' || n.role === 'saboteur', ok: (c) => c.length >= 2 },
};

/** One random try at a shape; null when it doesn't land on the count */
function tryShape(shape, pool, goal, maxFoes, pick) {
	const chosen = [];
	let total = 0;
	const add = (n) => {
		chosen.push(n);
		total += rankWeight(n);
	};
	if (shape.lead) {
		let leaders = pool.filter((n) => shape.lead(n) && rankWeight(n) <= goal);
		if (shape.count === 1) leaders = leaders.filter((n) => rankWeight(n) === goal);
		if (!leaders.length && shape.leadAlt) leaders = pool.filter((n) => shape.leadAlt(n) && rankWeight(n) < goal);
		if (!leaders.length) return null;
		add(pick(leaders));
	} else if (!shape.fill && !shape.count && Math.random() < 0.35) {
		// balanced: hard fights are often built around a boss
		const leaders = pool.filter((n) => !isSoldier(n) && rankWeight(n) <= goal);
		if (leaders.length) add(pick(leaders));
	}
	const fill = shape.fill ? pool.filter(shape.fill) : shape.count ? pool : pool.filter(isSoldier).length ? pool.filter(isSoldier) : pool;
	if (!fill.length && total < goal) return null;
	const max = shape.count ?? maxFoes;
	let guard = 0;
	while (total < goal && chosen.length < max && guard++ < 60) {
		const left = goal - total;
		let options = fill;
		// the last slot of a fixed-size group has to land exactly on the count
		if (shape.count && chosen.length === shape.count - 1) options = fill.filter((n) => rankWeight(n) === left);
		if (!options.length) return null;
		const same = chosen.filter(isSoldier);
		const repeat = shape.same ?? 0.45;
		const n = same.length && Math.random() < repeat && rankWeight(same[0]) <= left && (!shape.count || chosen.length < shape.count - 1) ? pick(same) : pick(options);
		if (rankWeight(n) > left) continue;
		add(n);
	}
	if (total !== goal) return null;
	if (shape.count && chosen.length !== shape.count) return null;
	if (shape.ok && !shape.ok(chosen)) return null;
	return chosen;
}

/**
 * Several-part adversaries (a Kraken is a bloated head and three slimy tentacles) go into a suggestion whole:
 * their parts leave the pool and come back as one boss that counts as all of them together. A group with a part
 * missing from the creatures shown is left out.
 */
function wholeAdversaries(pool) {
	const out = pool.filter((n) => !n.group);
	for (const [name, level, parts] of PART_GROUPS) {
		const have = pool.filter((n) => n.group === name);
		if (!have.length) continue;
		const byName = new Map(have.map((n) => [n.name.toLowerCase(), n]));
		const members = parts.map((p) => byName.get(p.toLowerCase()));
		if (members.some((m) => !m)) continue;
		const weight = members.reduce((t, m) => t + rankWeight(m), 0);
		const lead = members.find((m) => m.rank === 'champion') ?? members[0];
		out.push({ uuid: `group:${name}`, name, level, rank: 'champion', replaced: weight, role: lead.role, villain: members.some((m) => m.villain), members });
	}
	return out;
}

/**
 * A random encounter for a difficulty and shape from the creatures given: exactly the right soldier count,
 * preferring foes near the party's level and a mix of roles.
 * @returns {{npc:object, qty:number}[]}
 */
export function suggest(pool, party, difficulty = 'normal', shapeId = 'balanced', { tries = 800, maxFoes = 8 } = {}) {
	pool = wholeAdversaries(pool);
	if (!pool.length) return [];
	const shape = SHAPES[shapeId] ?? SHAPES.balanced;
	const heroes = Math.max(1, (Number(party.heroes) || 1) + (Number(party.allies) || 0));
	const goal = Math.max(1, { easy: heroes - 1, normal: heroes, hard: heroes + 1 }[difficulty] ?? heroes);
	const PL = Number(party.level) || 1;
	const pick = (list) => list[Math.floor(Math.random() * list.length)];
	let best = null;
	for (let t = 0; t < tries; t++) {
		const chosen = tryShape(shape, pool, goal, maxFoes, pick);
		if (!chosen) continue;
		let score = 0;
		for (const c of chosen) {
			const gap = Math.abs((Number(c.level) || 0) - PL);
			score += gap > 5 ? gap : 0;
			if ((Number(c.level) || 0) < PL) score += 2;
		}
		const roles = new Set(chosen.map((c) => c.role).filter(Boolean));
		if (shapeId !== 'pack' && shapeId !== 'horde') score -= roles.size * 1.5;
		const sup = chosen.filter((c) => c.role === 'support' && c.rank === 'soldier').length;
		if (sup > 1) score += 6 * (sup - 1);
		score += uniq(chosen) * 0.3 + Math.random() * 2;
		if (!best || score < best.score) best = { score, chosen };
	}
	const out = new Map();
	for (const n of (best?.chosen ?? []).flatMap((c) => c.members ?? [c])) {
		const e = out.get(n.uuid) ?? { npc: n, qty: 0 };
		e.qty++;
		out.set(n.uuid, e);
	}
	return [...out.values()];
}
