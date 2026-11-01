import { AFF, ATTRS, BOSS_SKILLS, CORE_ARRAYS, CORE_SKILLS, CORE_SPECIES, DAMAGE_TYPES, NEGATIVE_SKILLS, NPC_SPELLS, QA_LEVELS, QA_SPECIES, ROLES } from './creation-data.mjs';
import { HOMEBREW_ROLE_SKILLS, HOMEBREW_SPECIES_OPTIONS, attackFrom, randomAttack } from './ideas.mjs';

/**
 * A creature being built, and everything that follows from it: the stat block the builder shows, the skill
 * budget, what is still missing, and the Project FU actor it becomes.
 */

export function blankCreature(method = 'core') {
	return {
		method,
		name: '',
		img: 'icons/svg/mystery-man.svg',
		level: method === 'bestiary' ? 10 : 10,
		species: 'monster',
		rank: 'soldier',
		replaced: 2,
		villain: '',
		traits: ['', '', '', ''],
		aff: {},
		immune: [],
		attacks: startingAttacks('monster'),
		// the attacks are still the suggested ones: changing the Species suggests new ones
		autoAttacks: true,
		// special rules added from the books, homebrew, or written by hand: one Skill each
		extraSkills: [],
		// Quick Assembly attacks keep their numbers but can take a name
		attackNames: [],
		spells: [],
		notes: '',
		// Core Rulebook
		array: 'standard',
		assign: { dex: 0, ins: 1, mig: 2, wlp: 3 },
		ups: { 20: 'mig', 40: 'dex', 60: 'wlp' },
		coreSkills: [],
		// Bestiary
		role: 'brute',
		attackTypes: ['physical', 'physical'],
		spellAlt: false,
		custom: 'hp',
		roleSkills: [],
		bossSkills: [],
		negative: '',
		speciesPicks: [],
		speciesVuln: '',
	};
}

/** Two plain basic attacks from the books for a Species (no effect, so no Skill spent): one melee, one ranged */
export function startingAttacks(species) {
	const melee = randomAttack(species, { range: 'melee', plain: true });
	const ranged = randomAttack(species, { range: 'ranged', plain: true, not: melee ? [melee[0]] : [] });
	const list = [melee, ranged].filter(Boolean).map((a) => attackFrom(a));
	return list.length ? list : [{ name: 'Strike', range: 'melee', attrs: ['dex', 'mig'], type: 'physical', hr: 5, effect: '' }];
}

/** A role's Skills: the Bestiary's, then homebrew ones (marked) */
export const roleSkillsOf = (roleId) => [...((ROLES[roleId] ?? ROLES.brute).skills ?? []), ...(HOMEBREW_ROLE_SKILLS[roleId] ?? [])];

/** A Species' Quick Assembly options: the Bestiary's (strings), then homebrew ones ({name, text, homebrew}) */
export function speciesOptionsOf(species) {
	const q = QA_SPECIES[species] ?? QA_SPECIES.monster;
	return [...q.options.map((label) => ({ label })), ...(HOMEBREW_SPECIES_OPTIONS[species] ?? []).map(([name, text]) => ({ label: `${name}: ${text}`, name, text, homebrew: true }))];
}

const mult = (c) => (c.rank === 'elite' ? 2 : c.rank === 'champion' ? Math.max(2, Number(c.replaced) || 2) : 1);
const extraTurns = (c) => (c.rank === 'elite' ? 1 : c.rank === 'champion' ? Math.max(2, Number(c.replaced) || 2) : 0);
const dmgTier = (lv) => (lv >= 60 ? 15 : lv >= 40 ? 10 : lv >= 20 ? 5 : 0);
const step = (d, n) => Math.min(12, d + 2 * n);
const add = (o, fx = {}) => {
	for (const [k, v] of Object.entries(fx)) if (typeof v === 'number') o[k] = (o[k] ?? 0) + v;
};
export const allBossSkills = () => Object.values(BOSS_SKILLS).flat();

/** Affinities from the Species (and Quick Assembly options) that the GM didn't pick */
function speciesAff(c) {
	const sp = c.method === 'bestiary' ? QA_SPECIES[c.species] : CORE_SPECIES[c.species];
	const out = { ...(sp?.aff ?? {}) };
	if (c.method === 'bestiary' && c.speciesVuln) out[c.speciesVuln] = 'VU';
	return out;
}

/**
 * Everything that follows from the choices.
 * @returns {{attrs, hp, mp, crisis, init, def, mdef, acc, magic, extraDamage, aff, immune, budget, used, spellSlots, issues, items, notes}}
 */
export function computeCreature(c) {
	const lv = Number(c.level) || 5;
	const bonus = { hp: 0, mp: 0, init: 0, def: 0, mdef: 0, acc: 0, magic: 0 };
	const issues = [];
	const notes = [];
	const aff = {};
	for (const t of DAMAGE_TYPES) aff[t] = c.aff?.[t] ?? '';
	const sAff = speciesAff(c);
	for (const [t, v] of Object.entries(sAff)) if (!c.aff?.[t] || c.aff[t] === '') aff[t] = v;
	const immune = new Set([...(c.method === 'bestiary' ? QA_SPECIES[c.species]?.immune ?? [] : CORE_SPECIES[c.species]?.immune ?? []), ...(c.immune ?? [])]);
	let attrs;
	let hpBase;
	let mpBase;
	let budget = 0;
	let used = 0;
	let spellSlots = 0;
	const skillItems = [];
	const bossSpells = [];

	if (c.method === 'core') {
		const dice = CORE_ARRAYS[c.array]?.dice ?? CORE_ARRAYS.standard.dice;
		attrs = Object.fromEntries(ATTRS.map((a) => [a, dice[c.assign?.[a] ?? 0] ?? 8]));
		if (new Set(Object.values(c.assign ?? {})).size !== 4) issues.push('Give each Attribute a different die from the array.');
		for (const at of [20, 40, 60]) if (lv >= at && c.ups?.[at]) attrs[c.ups[at]] = step(attrs[c.ups[at]], 1);
		// Skills: Species + one per 10 levels + one per extra Vulnerability (two for physical) + rank
		const sp = CORE_SPECIES[c.species] ?? CORE_SPECIES.monster;
		const speciesVU = Object.entries(sAff).filter(([, v]) => v === 'VU').map(([t]) => t);
		const chosenVU = Object.entries(aff).filter(([t, v]) => v === 'VU' && !speciesVU.includes(t)).map(([t]) => t);
		const fromVU = chosenVU.reduce((n, t) => n + (t === 'physical' ? 2 : 1), 0) - (sp.choose?.VU ?? 0);
		budget = sp.skills + Math.floor(lv / 10) + Math.max(0, fromVU) + extraTurns(c);
		for (const pick of c.coreSkills ?? []) {
			const s = CORE_SKILLS.find((x) => x.id === pick.id);
			if (!s) continue;
			used++;
			add(bonus, pick.alt && s.alt ? s.alt : s.fx);
			spellSlots += (pick.alt && s.alt ? s.alt : s.fx)?.spells ?? 0;
			if (s.kind !== 'none' && s.kind !== 'spells') skillItems.push({ name: s.name, text: s.text, type: s.kind === 'skill' ? 'miscAbility' : 'rule' });
		}
		for (const s of CORE_SKILLS) {
			const n = (c.coreSkills ?? []).filter((p) => p.id === s.id).length;
			if (s.limited && n > 1) issues.push(`${s.name} can only be taken once.`);
			if (s.max && n > s.max) issues.push(`${s.name} can be taken at most ${s.max} times.`);
		}
		if (c.species === 'beast' && (c.coreSkills ?? []).some((p) => p.id === 'equipment')) issues.push('Beasts can’t take Use Equipment.');
		// an attack with an effect (a status, draining...) is the Special Attack Skill
		const special = (c.attacks ?? []).filter((a) => a.effect?.trim()).length;
		const taken = (c.coreSkills ?? []).filter((p) => p.id === 'special').length;
		if (special > taken) {
			used += special - taken;
			notes.push(`${special - taken} attack effect${special - taken === 1 ? '' : 's'} counted as Special Attack Skill${special - taken === 1 ? '' : 's'}.`);
		}
		hpBase = attrs.mig * 5 + lv * 2;
		mpBase = attrs.wlp * 5 + lv;
		bonus.acc += Math.floor(lv / 10);
		bonus.magic += Math.floor(lv / 10);
		const ch = sp.choose;
		if (ch?.RS && Object.values(aff).filter((v) => v === 'RS').length < ch.RS) issues.push(`${c.species[0].toUpperCase()}${c.species.slice(1)}: pick ${ch.RS} Resistances in Affinities.`);
		if (ch?.IM && Object.values(aff).filter((v) => v === 'IM').length < 2) issues.push('Elemental: pick a second Immunity in Affinities.');
		if (ch?.VU && !ch.from.some((t) => aff[t] === 'VU')) issues.push(`Plant: make it Vulnerable to one of ${ch.from.join(', ')}.`);
	} else {
		const role = ROLES[c.role] ?? ROLES.brute;
		const lvl = QA_LEVELS.includes(lv) ? lv : QA_LEVELS.reduce((a, b) => (Math.abs(b - lv) < Math.abs(a - lv) ? b : a));
		const row = role.stats.find((r) => r.level === lvl);
		attrs = { dex: row.dex, ins: row.ins, mig: row.mig, wlp: row.wlp };
		hpBase = row.hp;
		mpBase = row.mp;
		bonus.def += role.def;
		bonus.mdef += role.mdef;
		bonus.acc += Math.floor(lvl / 10);
		bonus.magic += Math.floor(lvl / 10);
		for (const [at, fx] of Object.entries(role.levelFx ?? {})) if (lvl >= Number(at)) add(bonus, fx);
		// Role Skills: one each at 20, 40, 60; one for elite; X for champion X; plus Species and Negative Skill picks
		const qs = QA_SPECIES[c.species] ?? QA_SPECIES.monster;
		const options = speciesOptionsOf(c.species);
		const picked = (c.speciesPicks ?? []).map((i) => options[i]).filter(Boolean);
		const picks = picked.map((o) => o.label);
		for (const o of picked) if (o.homebrew) skillItems.push({ name: o.name, text: o.text, type: 'rule' });
		const allowedPicks = qs.picks + (c.speciesVuln && qs.picksIfVuln ? qs.picksIfVuln : 0);
		if (picks.length > allowedPicks) issues.push(`${c.species}: pick at most ${allowedPicks} Species option${allowedPicks === 1 ? '' : 's'}.`);
		else if (picks.length < allowedPicks) issues.push(`${c.species}: ${allowedPicks - picks.length} Species option${allowedPicks - picks.length === 1 ? '' : 's'} left to pick.`);
		const speciesRole = picks.filter((p) => p.startsWith('One more Role Skill')).length;
		budget = [20, 40, 60].filter((x) => lvl >= x).length + extraTurns(c) + speciesRole + (c.negative ? 1 : 0);
		used = (c.roleSkills ?? []).length;
		const bossBudget = c.rank === 'champion' ? 1 : 0;
		for (const id of c.roleSkills ?? []) {
			const s = roleSkillsOf(c.role).find((x) => x.id === id);
			if (!s) continue;
			if (s.rank === 'elite+' && c.rank === 'soldier') issues.push(`${s.name} is for elites and champions.`);
			if (s.rank === 'champion' && c.rank !== 'champion') issues.push(`${s.name} is for champions.`);
			if (s.rank === 'soldier/elite' && c.rank === 'champion') issues.push(`${s.name} is for soldiers and elites.`);
			add(bonus, s.fx);
			spellSlots += s.fx?.spells ?? 0;
			skillItems.push({ name: s.name, text: s.text, type: 'rule' });
		}
		// customization: soldiers and elites
		if (c.rank !== 'champion') {
			if (c.custom === 'hp') bonus.hp += 10;
			else if (c.custom === 'alt') notes.push(role.customAlt ?? '');
			else if (c.custom === 'role') budget += 1;
			else {
				const s = role.custom.find((x) => x.id === c.custom);
				if (s) skillItems.push({ name: s.name, text: s.text, type: 'rule' });
			}
		}
		const boss = (c.bossSkills ?? []).map((id) => allBossSkills().find((x) => x.id === id)).filter(Boolean);
		if (boss.length > bossBudget + (c.negative && c.rank === 'champion' ? 1 : 0)) issues.push(c.rank === 'champion' ? 'A champion gets one Boss Skill (two with a Negative Skill, in place of its extra Role Skill).' : 'Boss Skills are for champions.');
		if (c.rank === 'champion' && !boss.length) issues.push('Pick a Boss Skill for this champion.');
		for (const s of boss) {
			if (s.minLevel && lvl < s.minLevel) issues.push(`${s.name} needs level ${s.minLevel}.`);
			if (s.ultima && !c.villain) notes.push(`${s.name} spends Ultima Points: make this champion a Villain.`);
			if (s.spell) bossSpells.push(s.spell);
			skillItems.push({ name: s.name, text: s.text, type: 'rule' });
		}
		used += Math.max(0, boss.length - bossBudget);
		if (c.negative) {
			const s = NEGATIVE_SKILLS.find((x) => x.id === c.negative);
			if (s) skillItems.push({ name: s.name, text: s.text, type: 'rule' });
		}
		for (const p of picks) {
			if (p === '+10 max HP') bonus.hp += 10;
			if (p.startsWith('Spell:')) {
				bonus.mp += 10;
				spellSlots += 1;
			}
			if (p === 'Flying') skillItems.push({ name: 'Flying', text: 'Flies: melee attacks can’t reach it unless the attacker can. Forced to land by damage it is Vulnerable to; loses this in Crisis.', type: 'rule' });
			if (p.startsWith('+3 to Opposed')) skillItems.push({ name: 'Specialist', text: p, type: 'rule' });
			if (p.startsWith('Thorns')) skillItems.push({ name: 'Thorns', text: 'After an enemy hits it in melee, it deals 5 physical damage to them (10 from level 30).', type: 'rule' });
			if (p.startsWith('Immune to two statuses') || p.startsWith('Resistance to two') || p.includes('becomes an Absorption')) notes.push(`${c.species}: ${p} (set it in Affinities / status immunities).`);
		}
		if (role.spells) {
			spellSlots += c.spellAlt ? role.spells.alt.count : role.spells.count;
			if (c.spellAlt) bonus.mp += role.spells.alt.mp;
		}
		for (const [at, txt] of Object.entries(role.perLevel)) if (lvl >= Number(at) && txt !== 'role') notes.push(`Level ${at}: ${txt}`);
		const need = role.vulns + (c.rank === 'champion' && (c.roleSkills ?? []).includes('advise-and-inspire') ? 1 : 0);
		const haveVU = Object.values(aff).filter((v) => v === 'VU').length;
		const speciesVU = Object.values(sAff).filter((v) => v === 'VU').length;
		if (haveVU - speciesVU < need) issues.push(`${role.label}s get ${need} Vulnerabilit${need === 1 ? 'y' : 'ies'} that fit their look (set them in Affinities).`);
		const qch = qs.choose;
		if (qch?.VU && !qch.from.some((t) => aff[t] === 'VU')) issues.push(`${c.species}: Vulnerable to one of ${qch.from.join(', ')}.`);
		if (qch?.RS && Object.values(aff).filter((v) => v === 'RS').length < qch.RS) issues.push(`${c.species}: pick ${qch.RS} Resistances in Affinities.`);
	}

	// special rules taken from the books, homebrew, or written by hand: one Skill each
	for (const x of c.extraSkills ?? []) {
		used++;
		if (x.name?.trim() || x.text?.trim()) skillItems.push({ name: x.name?.trim() || 'Special rule', text: x.text ?? '', type: 'rule' });
	}
	if (used > budget) issues.push(`${used - budget} Skill${used - budget === 1 ? '' : 's'} over the budget of ${budget}.`);
	const spells = [...new Set([...(c.spells ?? []), ...bossSpells])].map((id) => NPC_SPELLS.find((s) => s.id === id)).filter(Boolean);
	if (spells.length - bossSpells.length > spellSlots) issues.push(`${spells.length - bossSpells.length} spells, but the Skills chosen give ${spellSlots}.`);
	for (const s of spells) if (s.minLevel && lv < s.minLevel) issues.push(`${s.name} is for level ${s.minLevel}+.`);
	if (!c.name?.trim()) issues.push('Give it a name.');
	if (!c.attacks?.length) issues.push('Give it at least one basic attack.');

	const m = mult(c);
	const hp = (hpBase + bonus.hp) * m;
	const mp = (mpBase + bonus.mp) * (c.rank === 'champion' ? 2 : 1);
	return {
		attrs,
		hp,
		mp,
		crisis: Math.floor(hp / 2),
		init: (attrs.dex + attrs.ins) / 2 + bonus.init + (c.rank === 'soldier' ? 0 : m),
		def: attrs.dex + bonus.def,
		mdef: attrs.ins + bonus.mdef,
		acc: bonus.acc,
		magic: bonus.magic,
		extraDamage: dmgTier(lv),
		turns: c.rank === 'soldier' ? 1 : m,
		aff,
		immune: [...immune],
		budget,
		used,
		spellSlots,
		spells,
		skillItems,
		issues,
		notes: notes.filter(Boolean),
		// what goes on the actor (Project FU computes HP and MP from these)
		hpBonus: hpBase + bonus.hp - (attrs.mig * 5 + lv * 2),
		mpBonus: mpBase + bonus.mp - (attrs.wlp * 5 + lv),
		bonus,
	};
}

/** The basic attacks as they will be built, with the role's own attacks for Quick Assembly */
export function attacksOf(c) {
	if (c.method !== 'bestiary') return c.attacks ?? [];
	const role = ROLES[c.role] ?? ROLES.brute;
	const list = role.attacks.map((a, i) => ({ ...a, type: c.attackTypes?.[i] ?? 'physical' }));
	for (const id of c.roleSkills ?? []) {
		const s = roleSkillsOf(c.role).find((x) => x.id === id);
		if (s?.attack && !list.some((a) => a.name === s.attack.name)) list.push({ ...s.attack, type: c.attackTypes?.[list.length] ?? 'physical' });
	}
	// a name of your own, keeping the role's numbers (the original name stays as the kind of attack)
	return list.map((a, i) => (c.attackNames?.[i]?.trim() ? { ...a, kind: a.name, name: c.attackNames[i].trim() } : a));
}

const P = (t) => `<p>${String(t ?? '').replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])}</p>`;

/** The Project FU actor for a creature */
export function actorData(c, folder = null) {
	const r = computeCreature(c);
	const lv = Number(c.level) || 5;
	const system = {
		level: { value: lv },
		species: { value: c.species },
		rank: { value: c.rank, replacedSoldiers: c.rank === 'champion' ? Math.max(2, Number(c.replaced) || 2) : c.rank === 'elite' ? 2 : 1 },
		role: { value: c.method === 'bestiary' ? c.role : 'custom' },
		villain: { value: c.villain || '' },
		traits: { value: (c.traits ?? []).map((t) => t.trim()).filter(Boolean).join(', ') },
		useEquipment: { value: c.method === 'core' && (c.species === 'humanoid' || (c.coreSkills ?? []).some((p) => p.id === 'equipment')) },
		attributes: Object.fromEntries(ATTRS.map((a) => [a, { base: r.attrs[a], current: r.attrs[a] }])),
		affinities: Object.fromEntries(DAMAGE_TYPES.map((t) => [t, { base: AFF[r.aff[t] ?? ''] ?? 0 }])),
		immunities: Object.fromEntries(['slow', 'dazed', 'weak', 'shaken', 'enraged', 'poisoned'].map((s) => [s, { base: r.immune.includes(s) }])),
		resources: { hp: { bonus: r.hpBonus, value: r.hp }, mp: { bonus: r.mpBonus, value: r.mp }, fp: { value: { minor: 5, major: 10, supreme: 15 }[c.villain] ?? 0 } },
		derived: { def: { bonus: r.bonus.def }, mdef: { bonus: r.bonus.mdef }, init: { bonus: r.bonus.init } },
		bonuses: { accuracy: { accuracyCheck: r.acc, magicCheck: r.magic }, damage: { melee: r.extraDamage, ranged: r.extraDamage, spell: r.extraDamage } },
		description: [c.notes ? P(c.notes) : '', r.notes.length ? `<ul>${r.notes.map((n) => `<li>${P(n).slice(3, -4)}</li>`).join('')}</ul>` : ''].join(''),
	};
	const items = [];
	for (const a of attacksOf(c)) {
		const quality = [a.kind ? `${a.kind}.` : '', a.multi ? `Multi (${a.multi}).` : '', a.note ?? '', a.effect ?? ''].filter(Boolean).join(' ');
		items.push({
			name: a.name || 'Attack',
			type: 'basic',
			img: a.range === 'ranged' ? 'icons/weapons/bows/shortbow-recurve.webp' : 'icons/skills/melee/strike-sword-slashing-red.webp',
			system: { attributes: { primary: { value: a.attrs?.[0] ?? 'dex' }, secondary: { value: a.attrs?.[1] ?? 'mig' } }, damage: { value: Number(a.hr) || 5 }, type: { value: a.range === 'ranged' ? 'ranged' : 'melee' }, damageType: { value: a.type || 'physical' }, quality: { value: quality } },
		});
	}
	for (const s of r.spells) {
		items.push({
			name: s.name,
			type: 'spell',
			img: 'icons/magic/symbols/runes-star-pentagon-blue.webp',
			system: {
				description: P(s.text),
				isOffensive: { value: !!s.offensive },
				duration: { value: s.duration === 'scene' ? 'scene' : 'instantaneous' },
				cost: { resource: 'mp', amount: String(s.mp), perTarget: !!s.perTarget },
				hasRoll: { value: !!s.offensive },
				rollInfo: { attributes: { primary: { value: 'ins' }, secondary: { value: 'wlp' } }, damage: s.hr ? { hasDamage: { value: true }, value: s.hr, type: { value: 'physical' } } : { hasDamage: { value: false } } },
			},
		});
	}
	for (const s of r.skillItems) {
		items.push({ name: s.name, type: s.type, img: s.type === 'rule' ? 'icons/sundries/scrolls/scroll-runed-brown-purple.webp' : 'icons/magic/control/buff-strength-muscle-damage-orange.webp', system: { description: P(s.text) } });
	}
	return { name: c.name || 'New creature', type: 'npc', img: c.img, folder, system, items, prototypeToken: { name: c.name || 'New creature', disposition: -1, actorLink: false } };
}

export { HOMEBREW_ROLE_SKILLS };
export { CORE_ARRAYS, CORE_SKILLS, CORE_SPECIES, NPC_SPELLS, QA_LEVELS, QA_SPECIES, ROLES, BOSS_SKILLS, NEGATIVE_SKILLS };
