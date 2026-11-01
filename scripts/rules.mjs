/**
 * How an encounter is weighed. Two methods, picked with the toggle in the builder:
 *
 * - Core Rulebook: count soldier-equivalents against the number of heroes. A soldier counts 1, an elite 2, a
 *   champion as many soldiers as it replaces. As many as the heroes is a fair fight; one more is a hard boss
 *   battle; fewer is easier.
 * - Bestiary: the same rank weights, but each foe also counts more or less by how far its level is from the
 *   party's, and the total is compared to a budget per hero.
 *
 * Every number lives in this file so a GM can match their own table (or the book) by changing it here.
 */

export const DIFFICULTIES = [
	{ id: 'trivial', label: 'Trivial', color: '#8aa0b8' },
	{ id: 'easy', label: 'Easy', color: '#6fe3a0' },
	{ id: 'balanced', label: 'Balanced', color: '#7cb8ff' },
	{ id: 'hard', label: 'Hard', color: '#f2c45a' },
	{ id: 'deadly', label: 'Deadly', color: '#ff6b7a' },
];

/** What a foe counts as, by rank */
export function rankWeight(npc) {
	if (npc.rank === 'champion') return Math.max(1, Number(npc.replaced) || 1);
	if (npc.rank === 'elite') return 2;
	return 1;
}

export const RANK_LABEL = { soldier: 'Soldier', elite: 'Elite', champion: 'Champion' };
export const rankText = (npc) => (npc.rank === 'champion' ? `Champion ${Math.max(1, Number(npc.replaced) || 1)}` : (RANK_LABEL[npc.rank] ?? 'Soldier'));

/** Bestiary method: how much a foe's level gap to the party scales what it counts as */
export const LEVEL_FACTORS = [
	{ upTo: -10, factor: 0.5 },
	{ upTo: -5, factor: 0.75 },
	{ upTo: 4, factor: 1 },
	{ upTo: 9, factor: 1.5 },
	{ upTo: Infinity, factor: 2 },
];

/** Bestiary method: budgets per hero for each difficulty (the total at the low end of each band) */
export const BESTIARY_BANDS = { easy: 0.6, balanced: 0.9, hard: 1.15, deadly: 1.6 };
/** ...and what the Suggest button aims for in each */
export const BESTIARY_AIM = { easy: 0.75, balanced: 1, hard: 1.35, deadly: 1.9 };

export function levelFactor(gap) {
	for (const f of LEVEL_FACTORS) if (gap <= f.upTo) return f.factor;
	return 1;
}

const r1 = (n) => Math.round(n * 10) / 10;

export const METHODS = {
	core: {
		label: 'Core Rulebook',
		blurb:
			'Counts soldier-equivalents against the number of heroes: a soldier is 1, an elite 2, a champion as many soldiers as it replaces. As many as the heroes is a fair fight, one more is a hard boss battle (most bosses should be), fewer is easier. Pick foes close to the party’s level; ones far above or below are flagged.',
		weight: (npc) => rankWeight(npc),
		/** the total that starts each difficulty, and the one Suggest aims for */
		bands: (heroes) => ({ easy: heroes - 1, balanced: heroes, hard: heroes + 1, deadly: heroes + 2 }),
		aim: (heroes) => ({ easy: Math.max(1, heroes - 1), balanced: heroes, hard: heroes + 1, deadly: heroes + 2 }),
		unit: 'soldiers',
	},
	bestiary: {
		label: 'Bestiary',
		blurb:
			'Weighs each foe by rank (soldier 1, elite 2, champion as many soldiers as it replaces) and by its level next to the party’s: half as much 10 or more levels below, ¾ from 5 below, 1½ from 5 above, double from 10 above. The total is compared to a budget per hero, so a few strong foes and a crowd of weak ones can be equally hard.',
		weight: (npc, party) => rankWeight(npc) * levelFactor((Number(npc.level) || 0) - party.level),
		bands: (heroes) => Object.fromEntries(Object.entries(BESTIARY_BANDS).map(([k, v]) => [k, heroes * v])),
		aim: (heroes) => Object.fromEntries(Object.entries(BESTIARY_AIM).map(([k, v]) => [k, heroes * v])),
		unit: 'threat',
	},
};

/**
 * @param {'core'|'bestiary'} methodId
 * @param {{npc:object, qty:number}[]} entries
 * @param {{heroes:number, level:number}} party
 */
export function evaluate(methodId, entries, party) {
	const m = METHODS[methodId] ?? METHODS.core;
	const heroes = Math.max(1, Number(party.heroes) || 1);
	let total = 0;
	let count = 0;
	const warnings = [];
	let villains = [];
	for (const { npc, qty } of entries) {
		total += m.weight(npc, party) * qty;
		count += qty;
		const gap = (Number(npc.level) || 0) - party.level;
		if (gap >= 10) warnings.push(`${npc.name} is ${gap} levels above the party: expect a very hard fight.`);
		else if (gap <= -10) warnings.push(`${npc.name} is ${-gap} levels below the party: barely a threat.`);
		if (npc.villain) villains.push(npc);
	}
	villains = [...new Map(villains.map((v) => [v.name, v])).values()];
	for (const v of villains) warnings.push(`${v.name} is a ${v.villain} villain: give them ${{ minor: 5, major: 10, supreme: 15 }[v.villain] ?? 5} Ultima Points.`);
	const bands = m.bands(heroes);
	let rating = 'trivial';
	if (count) for (const d of ['easy', 'balanced', 'hard', 'deadly']) if (total >= bands[d] - 1e-9) rating = d;
	const top = Math.max(bands.deadly * 1.25, total, 1);
	return {
		method: methodId,
		unit: m.unit,
		total: r1(total),
		count,
		heroes,
		bands: Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, r1(v)])),
		aim: m.aim(heroes),
		rating: count ? rating : null,
		/** where each band starts and where the total sits, as % of the meter */
		meter: { pct: Math.min(100, (total / top) * 100), marks: Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, Math.min(100, (v / top) * 100)])) },
		warnings,
	};
}

/**
 * A random encounter close to a difficulty, from the creatures given.
 * @returns {{npc:object, qty:number}[]}
 */
export function suggest(methodId, pool, party, difficulty = 'balanced', { tries = 400, maxFoes = 8 } = {}) {
	const m = METHODS[methodId] ?? METHODS.core;
	if (!pool.length) return [];
	const heroes = Math.max(1, Number(party.heroes) || 1);
	const goal = m.aim(heroes)[difficulty] ?? heroes;
	const pick = (list) => list[Math.floor(Math.random() * list.length)];
	const byRank = { soldier: [], elite: [], champion: [] };
	for (const n of pool) (byRank[n.rank] ?? byRank.soldier).push(n);
	let best = null;
	for (let t = 0; t < tries; t++) {
		const chosen = [];
		let total = 0;
		// sometimes build around a leader: an elite, or a champion for hard fights
		const leaderRoll = Math.random();
		const leaders = difficulty === 'hard' || difficulty === 'deadly' ? [...byRank.champion, ...byRank.elite] : leaderRoll < 0.4 ? byRank.elite : [];
		if (leaders.length && leaderRoll < 0.75) {
			const l = pick(leaders);
			const w = m.weight(l, party);
			if (w <= goal + 0.5) {
				chosen.push(l);
				total += w;
			}
		}
		// then soldiers (or anything) until close to the goal
		const fill = byRank.soldier.length ? byRank.soldier : pool;
		let guard = 0;
		while (total < goal - 0.25 && chosen.length < maxFoes && guard++ < 30) {
			const n = Math.random() < 0.7 && chosen.length ? pick(chosen.filter((c) => c.rank === 'soldier').concat(pick(fill))) : pick(fill);
			const w = m.weight(n, party);
			if (total + w > goal + 0.6) continue;
			chosen.push(n);
			total += w;
		}
		const off = Math.abs(goal - total);
		// a little variety: prefer fewer kinds when equally close
		const kinds = new Set(chosen.map((c) => c.uuid)).size;
		const score = off * 10 + kinds * 0.05 + Math.random() * 0.01;
		if (!best || score < best.score) best = { score, chosen };
		if (off < 0.05 && kinds <= 3) break;
	}
	const out = new Map();
	for (const n of best?.chosen ?? []) {
		const e = out.get(n.uuid) ?? { npc: n, qty: 0 };
		e.qty++;
		out.set(n.uuid, e);
	}
	return [...out.values()];
}
