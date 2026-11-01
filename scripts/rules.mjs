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
/*  Methods                                                            */
/* ------------------------------------------------------------------ */

export const METHODS = {
	core: {
		label: 'Core Rulebook',
		blurb:
			'Counts soldiers against the heroes: an elite counts as 2, a champion X as X. Easy is one fewer than the heroes, Normal as many, Hard one more (most boss battles should be hard). Party Level is the highest hero’s level: foes below it are probably too weak, within 5 levels appropriate, within 10 a significant threat, and 11+ above probably too strong.',
	},
	bestiary: {
		label: 'Bestiary',
		blurb:
			'The same count, read as enemy turns per round against the heroes’ turns, built for about four heroes with foes within 5 levels of them: a foe further off gets the Bestiary’s level adjustment instead. Mix roles (brute, hunter, mage, saboteur, sentinel, support), keep small or fragile groups to Easy or Normal, give big or optimized groups Hard fights rather than higher levels, and alternate lone champions with mixed groups.',
	},
};

/**
 * @param {'core'|'bestiary'} methodId
 * @param {{npc:object, qty:number}[]} entries
 * @param {{heroes:number, allies?:number, level:number}} party
 */
export function evaluate(methodId, entries, party) {
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

	// levels
	for (const { npc } of entries) {
		const b = levelBand(npc.level, PL);
		if (methodId === 'core') {
			if (b.id === 'weak') warnings.push(`${npc.name} (Lv ${npc.level}) is below the Party Level: probably too weak.`);
			if (b.id === 'threat') notes.push(`${npc.name} (Lv ${npc.level}) is ${b.gap} levels above the party: a significant threat.`);
			if (b.id === 'strong') warnings.push(`${npc.name} (Lv ${npc.level}) is ${b.gap} levels above the party: probably too strong.`);
		} else if (Math.abs(b.gap) > 5) {
			const target = PL + Math.sign(b.gap) * 5;
			warnings.push(`${npc.name} (Lv ${npc.level}) is outside 5 levels of the party. ${levelAdjustment(npc, Math.max(5, Math.min(60, target)))}`);
		}
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

	if (methodId === 'bestiary') {
		const n = Number(party.heroes) || 1;
		if (n < 4 && rating === 'hard') notes.push('Groups of two or three heroes have a harder time: the Bestiary suggests Easy or Normal fights, or fewer enemy turns (a champion 4 becomes a champion 3).');
		if (n > 4 && (rating === 'easy' || rating === 'normal')) notes.push('For groups above four heroes the Bestiary suggests Hard fights rather than higher-level foes.');
		const roles = entries.map((e) => e.npc.role).filter(Boolean);
		const kinds = new Set(roles);
		if (count >= 3 && roles.length >= 2 && kinds.size === 1) warnings.push(`Every known role here is ${[...kinds][0]}: the best conflicts mix roles.`);
		const supportSoldiers = entries.filter((e) => e.npc.role === 'support' && e.npc.rank === 'soldier').reduce((s, e) => s + e.qty, 0);
		if (supportSoldiers > 1) warnings.push('Most conflicts should only include one support soldier, so the fight doesn’t drag on.');
		if (entries.some((e) => e.npc.role === 'mage' && e.npc.rank === 'soldier') && !roles.includes('sentinel') && count >= 3) notes.push('Soldier mages are usually the main source of damage: a sentinel to protect them makes them harder to rush down.');
	}

	const top = Math.max(bands.hard + 2, total, 1);
	return {
		method: methodId,
		unit: methodId === 'bestiary' ? (total === 1 ? 'enemy turn' : 'enemy turns') : total === 1 ? 'soldier' : 'soldiers',
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

/**
 * A random encounter for a difficulty from the creatures given: exactly the right soldier count, preferring
 * foes near the party's level and (with the Bestiary method) a mix of roles.
 * @returns {{npc:object, qty:number}[]}
 */
export function suggest(methodId, pool, party, difficulty = 'normal', { tries = 500, maxFoes = 8 } = {}) {
	if (!pool.length) return [];
	const heroes = Math.max(1, (Number(party.heroes) || 1) + (Number(party.allies) || 0));
	const goal = Math.max(1, { easy: heroes - 1, normal: heroes, hard: heroes + 1 }[difficulty] ?? heroes);
	const PL = Number(party.level) || 1;
	const pick = (list) => list[Math.floor(Math.random() * list.length)];
	let best = null;
	for (let t = 0; t < tries; t++) {
		const chosen = [];
		let total = 0;
		// hard fights are often built around a boss: a champion, or an elite
		if ((difficulty === 'hard' && Math.random() < 0.7) || Math.random() < 0.3) {
			const leaders = pool.filter((n) => n.rank !== 'soldier' && rankWeight(n) <= goal);
			if (leaders.length) {
				const l = pick(leaders);
				chosen.push(l);
				total += rankWeight(l);
			}
		}
		const soldiers = pool.filter((n) => n.rank === 'soldier');
		const fill = soldiers.length ? soldiers : pool;
		let guard = 0;
		while (total < goal && chosen.length < maxFoes && guard++ < 40) {
			// groups of the same soldier are common; so are mixed squads
			const same = chosen.filter((c) => c.rank === 'soldier');
			const n = same.length && Math.random() < 0.45 ? pick(same) : pick(fill);
			const w = rankWeight(n);
			if (total + w > goal) continue;
			chosen.push(n);
			total += w;
		}
		if (total !== goal) continue;
		let score = 0;
		for (const c of chosen) {
			const gap = Math.abs((Number(c.level) || 0) - PL);
			score += gap > 5 ? gap : 0;
			if ((Number(c.level) || 0) < PL) score += 2;
		}
		if (methodId === 'bestiary') {
			const roles = new Set(chosen.map((c) => c.role).filter(Boolean));
			score -= roles.size * 1.5;
			const sup = chosen.filter((c) => c.role === 'support' && c.rank === 'soldier').length;
			if (sup > 1) score += 6 * (sup - 1);
		}
		score += new Set(chosen.map((c) => c.uuid)).size * 0.3 + Math.random();
		if (!best || score < best.score) best = { score, chosen };
	}
	const out = new Map();
	for (const n of best?.chosen ?? []) {
		const e = out.get(n.uuid) ?? { npc: n, qty: 0 };
		e.qty++;
		out.set(n.uuid, e);
	}
	return [...out.values()];
}
