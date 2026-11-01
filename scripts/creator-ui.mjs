import { AFF, ATTRS, ATTR_LABEL, DAMAGE_TYPES, SPECIES, STATUSES } from './creation-data.mjs';
import { BOSS_SKILLS, CORE_ARRAYS, CORE_SKILLS, CORE_SPECIES, NEGATIVE_SKILLS, NPC_SPELLS, QA_LEVELS, QA_SPECIES, ROLES, actorData, attacksOf, blankCreature, computeCreature } from './creation.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const opt = (v, label, sel) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(label)}</option>`;
const AFF_ORDER = ['', 'VU', 'RS', 'IM', 'AB'];
const AFF_WORD = { '': '—', VU: 'VU', RS: 'RS', IM: 'IM', AB: 'AB' };
const AFF_COLOR = { '': 'rgba(238,243,255,.45)', VU: '#ff8d99', RS: '#9fd0ff', IM: '#f2c45a', AB: '#6fe3a0' };
const TYPE_ABBR = { physical: 'PHY', air: 'AIR', bolt: 'BLT', dark: 'DRK', earth: 'ERT', fire: 'FIR', ice: 'ICE', light: 'LGT', poison: 'PSN' };

export const METHOD_BLURB = {
	core: 'Core Rulebook, “Designing NPCs”: pick an Attribute array, a Species and any number of basic attacks, then spend Skills: the Species’ starting Skills, one more every 10 levels, one per extra Vulnerability (two for physical), plus one for an elite or X for a champion X. Hit Points, Mind Points, Initiative and defenses follow the book’s formulas.',
	bestiary: 'Bestiary, “Quick Assembly”: pick a role (brute, hunter, mage, saboteur, sentinel, support) and a level (5 or a multiple of 10); the role sets the Attributes, HP, MP, defenses and attacks. Add Role Skills (one each at 20, 40 and 60, one for elites, X for champions X), a Boss Skill for champions, Species options, and an optional Negative Skill for one more Skill. No equipment.',
};

/** The Create tab */
export function creatorHTML(c) {
	const r = computeCreature(c);
	const role = ROLES[c.role] ?? ROLES.brute;
	const lvSel = c.method === 'bestiary' ? `<select data-c="level">${QA_LEVELS.map((l) => opt(l, l, c.level)).join('')}</select>` : `<input type="number" min="5" max="60" data-c="level" value="${c.level}">`;
	return `
	<section class="cform">
		<div class="seg">${['core', 'bestiary'].map((m) => `<button type="button" class="${c.method === m ? 'on' : ''}" data-cmethod="${m}">${m === 'core' ? 'Core Rulebook' : 'Bestiary'}</button>`).join('')}</div>
		<p class="blurb">${esc(METHOD_BLURB[c.method])}</p>

		<div class="cgrid id">
			<button type="button" class="por" data-cact="img" data-tooltip="Choose art"><img src="${esc(c.img)}" alt=""></button>
			<label class="w2"><span>Name</span><input type="text" data-c="name" value="${esc(c.name)}" placeholder="Name"></label>
			<label><span>Level</span>${lvSel}</label>
			<label><span>Species</span><select data-c="species">${SPECIES.map((s) => opt(s, cap(s), c.species)).join('')}</select></label>
			<label><span>Rank</span><select data-c="rank">${['soldier', 'elite', 'champion'].map((s) => opt(s, cap(s), c.rank)).join('')}</select></label>
			${c.rank === 'champion' ? `<label><span>Replaces</span><select data-c="replaced">${[2, 3, 4, 5, 6].map((n) => opt(n, `${n} soldiers`, c.replaced)).join('')}</select></label>` : ''}
			<label><span>Villain</span><select data-c="villain">${opt('', 'No', c.villain)}${['minor', 'major', 'supreme'].map((v) => opt(v, `${cap(v)} (${{ minor: 5, major: 10, supreme: 15 }[v]} UP)`, c.villain)).join('')}</select></label>
		</div>
		<p class="note">${esc(c.method === 'core' ? CORE_SPECIES[c.species]?.note : speciesNote(c))}</p>
		<label class="traits"><span>Traits</span><span class="row">${[0, 1, 2, 3].map((i) => `<input type="text" data-trait="${i}" value="${esc(c.traits?.[i] ?? '')}" placeholder="trait ${i + 1}">`).join('')}</span></label>

		${c.method === 'core' ? coreHTML(c) : bestiaryHTML(c, role)}

		<h4>Affinities and immunities</h4>
		<div class="affs">${DAMAGE_TYPES.map((t) => `<button type="button" class="aff" data-aff="${t}" style="--c:${AFF_COLOR[r.aff[t]]}" data-tooltip="${cap(t)}: click to cycle Vulnerable, Resistant, Immune, Absorbs"><small>${TYPE_ABBR[t]}</small><b>${AFF_WORD[r.aff[t]]}</b></button>`).join('')}</div>
		<div class="chips">${STATUSES.map((s) => `<label class="chip ${r.immune.includes(s) ? 'on' : ''}"><input type="checkbox" data-immune="${s}" ${r.immune.includes(s) ? 'checked' : ''}>${cap(s)}</label>`).join('')}</div>

		${spellsHTML(c, r)}

		<h4>Notes</h4>
		<textarea data-c="notes" rows="3" placeholder="Tactics, routine, special rules of your own…">${esc(c.notes)}</textarea>
	</section>
	<section class="cprev">${previewHTML(c, r)}</section>`;
}

function speciesNote(c) {
	const q = QA_SPECIES[c.species];
	const bits = [];
	if (q.aff) bits.push(Object.entries(q.aff).map(([t, v]) => `${v} ${t}`).join(', '));
	if (q.immune) bits.push(`immune to ${q.immune.join(', ')}`);
	if (q.choose?.RS) bits.push(`${q.choose.RS} Resistances of your choice`);
	if (q.choose?.IM) bits.push('Immune to one more type of your choice');
	if (q.choose?.VU) bits.push(`Vulnerable to one of ${q.choose.from.join(', ')}`);
	bits.push(q.picks ? `then ${q.picks} option${q.picks === 1 ? '' : 's'} below` : 'an optional extra Vulnerability unlocks one option below');
	return `${cap(c.species)} (Quick Assembly): ${bits.join('; ')}.`;
}

function coreHTML(c) {
	const dice = CORE_ARRAYS[c.array].dice;
	const lv = Number(c.level) || 5;
	return `
		<h4>Attributes</h4>
		<div class="cgrid">
			<label class="w2"><span>Array</span><select data-c="array">${Object.entries(CORE_ARRAYS).map(([k, a]) => opt(k, a.label, c.array)).join('')}</select></label>
			${ATTRS.map((a) => `<label><span>${ATTR_LABEL[a]}</span><select data-assign="${a}">${dice.map((d, i) => opt(i, `d${d}`, c.assign?.[a])).join('')}</select></label>`).join('')}
		</div>
		${[20, 40, 60].some((x) => lv >= x) ? `<div class="cgrid"><span class="lbl">One die size up at</span>${[20, 40, 60].filter((x) => lv >= x).map((x) => `<label><span>Level ${x}</span><select data-up="${x}">${ATTRS.map((a) => opt(a, ATTR_LABEL[a], c.ups?.[x])).join('')}</select></label>`).join('')}</div>` : ''}

		<h4>Basic attacks</h4>
		<div class="attacks">${(c.attacks ?? [])
			.map(
				(a, i) => `<div class="atk" data-atk="${i}">
				<input type="text" data-a="name" value="${esc(a.name)}" placeholder="Attack name">
				<select data-a="range">${opt('melee', 'Melee', a.range)}${opt('ranged', 'Ranged', a.range)}</select>
				<select data-a="a0">${ATTRS.map((x) => opt(x, ATTR_LABEL[x], a.attrs?.[0])).join('')}</select>
				<select data-a="a1">${ATTRS.map((x) => opt(x, ATTR_LABEL[x], a.attrs?.[1])).join('')}</select>
				<select data-a="type">${DAMAGE_TYPES.map((t) => opt(t, cap(t), a.type)).join('')}</select>
				<span class="hr">HR + ${a.hr ?? 5}</span>
				<button type="button" class="x" data-cact="delatk" data-i="${i}" aria-label="Remove attack">✕</button>
			</div>`,
			)
			.join('')}
			<button type="button" class="ghost add" data-cact="addatk">+ Attack</button>
		</div>

		<h4>Skills <small>${budgetText(c)}</small></h4>
		<div class="skills">${CORE_SKILLS.map((s) => {
			const n = (c.coreSkills ?? []).filter((p) => p.id === s.id).length;
			return `<div class="sk ${n ? 'on' : ''}"><div><b>${esc(s.name)}${s.limited ? ' <em>limited</em>' : s.max ? ` <em>max ${s.max}</em>` : ''}</b><p>${esc(s.text)}</p></div>
				${s.alt ? `<label class="alt" data-tooltip="Use the other option">${n ? `<input type="checkbox" data-alt="${s.id}" ${(c.coreSkills ?? []).some((p) => p.id === s.id && p.alt) ? 'checked' : ''}> alt` : ''}</label>` : '<span></span>'}
				<span class="cnt"><button type="button" data-skill="${s.id}" data-d="-1" ${n ? '' : 'disabled'}>−</button><b>${n}</b><button type="button" data-skill="${s.id}" data-d="1">+</button></span></div>`;
		}).join('')}</div>`;
}

function budgetText(c) {
	const r = computeCreature(c);
	return `<span class="${r.used > r.budget ? 'bad' : r.used === r.budget ? 'ok' : ''}">${r.used} / ${r.budget} used</span>`;
}

function bestiaryHTML(c, role) {
	const lv = Number(c.level) || 5;
	const q = QA_SPECIES[c.species];
	const customs = [
		...(c.role === 'brute' ? [['hp', '+10 maximum HP']] : c.role === 'mage' ? [['alt', 'Immunity to one damage type']] : [['role', 'One more Role Skill']]),
		...role.custom.map((s) => [s.id, `${s.name}: ${s.text}`]),
	];
	const attacks = attacksOf(c);
	return `
		<h4>Role</h4>
		<div class="roles">${Object.entries(ROLES).map(([k, x]) => `<button type="button" class="rolecard ${c.role === k ? 'on' : ''}" data-role="${k}"><b>${x.label}</b><small>${esc(x.blurb)}</small></button>`).join('')}</div>

		<h4>Attacks</h4>
		<div class="attacks">${attacks
			.map((a, i) => `<div class="atk qa"><b>${esc(a.name)}</b><span>${a.range === 'ranged' ? 'Ranged' : 'Melee'} · (${ATTR_LABEL[a.attrs[0]]} + ${ATTR_LABEL[a.attrs[1]]}) · HR + ${a.hr}${a.multi ? ` · multi (${a.multi})` : ''}</span><select data-atype="${i}">${DAMAGE_TYPES.map((t) => opt(t, cap(t), c.attackTypes?.[i] ?? 'physical')).join('')}</select>${a.note ? `<p>${esc(a.note)}</p>` : ''}</div>`)
			.join('')}</div>

		${
			c.rank !== 'champion'
				? `<h4>Customization <small>soldiers and elites</small></h4><select data-c="custom" class="wide">${customs.map(([v, l]) => opt(v, l, c.custom)).join('')}</select>`
				: ''
		}

		<h4>Role Skills <small>${budgetText(c)}</small></h4>
		<p class="note">${[20, 40, 60].filter((x) => lv >= x).length} from level${c.rank !== 'soldier' ? `, ${c.rank === 'elite' ? 1 : Math.max(2, Number(c.replaced) || 2)} from rank` : ''}; Species options and a Negative Skill can add more.</p>
		<div class="skills">${role.skills
			.map((s) => {
				const on = (c.roleSkills ?? []).includes(s.id);
				const lock = (s.rank === 'elite+' && c.rank === 'soldier') || (s.rank === 'champion' && c.rank !== 'champion') || (s.rank === 'soldier/elite' && c.rank === 'champion');
				return `<label class="sk ${on ? 'on' : ''} ${lock ? 'lock' : ''}"><div><b>${esc(s.name)}${s.rank ? ` <em>${s.rank === 'elite+' ? 'elite, champion' : s.rank}</em>` : ''}</b><p>${esc(s.text)}</p></div><span></span><input type="checkbox" data-rskill="${s.id}" ${on ? 'checked' : ''}></label>`;
			})
			.join('')}</div>

		${
			c.rank === 'champion'
				? `<h4>Boss Skill <small>one for champions</small></h4>
		<div class="skills boss">${Object.entries(BOSS_SKILLS)
			.map(
				([g, list]) => `<div class="grp">${esc(g)}</div>${list
					.map((s) => {
						const on = (c.bossSkills ?? []).includes(s.id);
						return `<label class="sk ${on ? 'on' : ''} ${s.minLevel && lv < s.minLevel ? 'lock' : ''}"><div><b>${esc(s.name)}${s.ultima ? ' <em>Ultima</em>' : ''}${s.minLevel ? ` <em>level ${s.minLevel}+</em>` : ''}</b><p>${esc(s.text)}</p></div><span></span><input type="checkbox" data-bskill="${s.id}" ${on ? 'checked' : ''}></label>`;
					})
					.join('')}`,
			)
			.join('')}</div>`
				: ''
		}

		<h4>Species options <small>${cap(c.species)}</small></h4>
		${q.optVuln ? `<label class="fld"><span>Extra Vulnerability (unlocks one option)</span><select data-c="speciesVuln">${opt('', 'None', c.speciesVuln)}${q.optVuln.map((t) => opt(t, cap(t), c.speciesVuln)).join('')}</select></label>` : ''}
		<div class="chips">${q.options.map((o, i) => `<label class="chip ${(c.speciesPicks ?? []).includes(i) ? 'on' : ''}"><input type="checkbox" data-spick="${i}" ${(c.speciesPicks ?? []).includes(i) ? 'checked' : ''}>${esc(o)}</label>`).join('')}</div>

		<h4>Negative Skill <small>optional: one more Role (or Boss) Skill</small></h4>
		<select data-c="negative" class="wide">${opt('', 'None', c.negative)}${NEGATIVE_SKILLS.map((s) => opt(s.id, `${s.name}: ${s.text}`, c.negative)).join('')}</select>
		${role.spells ? `<label class="fld check"><input type="checkbox" data-c="spellAlt" ${c.spellAlt ? 'checked' : ''}> One spell and +10 MP instead of two spells</label><p class="note">Also on this role’s list: ${esc(role.spells.classSpells)}. Add those from the compendium after creating it.</p>` : ''}`;
}

function spellsHTML(c, r) {
	const role = ROLES[c.role];
	let list = NPC_SPELLS;
	if (c.method === 'bestiary') {
		const ids = new Set([...(role?.spells?.list ?? [])]);
		for (const id of c.roleSkills ?? []) for (const s of role?.skills?.find((x) => x.id === id)?.spellList ?? []) ids.add(s);
		const qs = QA_SPECIES[c.species];
		for (const p of (c.speciesPicks ?? []).map((i) => qs.options[i])) {
			if (!p?.startsWith('Spell:')) continue;
			for (const s of NPC_SPELLS) if (p.includes(s.name)) ids.add(s.id);
		}
		list = NPC_SPELLS.filter((s) => ids.has(s.id) || (c.spells ?? []).includes(s.id));
	}
	if (!r.spellSlots && !(c.spells ?? []).length) return c.method === 'core' ? '<p class="note">Take Spellcaster to learn NPC Spells.</p>' : '';
	return `<h4>Spells <small><span class="${(c.spells ?? []).length > r.spellSlots ? 'bad' : ''}">${(c.spells ?? []).length} / ${r.spellSlots}</span></small></h4>
		<div class="skills">${list
			.map((s) => {
				const on = (c.spells ?? []).includes(s.id);
				return `<label class="sk ${on ? 'on' : ''}"><div><b>${esc(s.name)} <em>${s.mp}${s.perTarget ? ' × T' : ''} MP${s.offensive ? ' · offensive' : ''}</em></b><p>${esc(s.text)}</p></div><span></span><input type="checkbox" data-spell="${s.id}" ${on ? 'checked' : ''}></label>`;
			})
			.join('')}</div>`;
}

/** The stat block, as it will come out */
function previewHTML(c, r) {
	const attacks = attacksOf(c);
	return `
		<div class="sb">
			<header><img src="${esc(c.img)}" alt=""><div><b>${esc(c.name || 'New creature')}</b><small>Lv ${c.level} · ${cap(c.species)} · ${c.rank === 'champion' ? `Champion ${c.replaced}` : cap(c.rank)}${c.method === 'bestiary' ? ` · ${ROLES[c.role]?.label}` : ''}${c.villain ? ` · ${cap(c.villain)} villain` : ''}</small></div></header>
			<div class="attrs">${ATTRS.map((a) => `<span><small>${ATTR_LABEL[a]}</small><b>d${r.attrs[a]}</b></span>`).join('')}</div>
			<div class="nums">
				<span class="hp"><small>HP</small><b>${r.hp}</b><em>Crisis ${r.crisis}</em></span>
				<span class="mp"><small>MP</small><b>${r.mp}</b></span>
				<span><small>INIT</small><b>${r.init}</b></span>
				<span><small>DEF</small><b>${r.def}</b></span>
				<span><small>M.DEF</small><b>${r.mdef}</b></span>
			</div>
			<p class="line">${r.turns} turn${r.turns === 1 ? '' : 's'} per round · +${r.acc} Accuracy, +${r.magic} Magic${r.extraDamage ? ` · ${r.extraDamage} extra damage` : ''}</p>
			<div class="affs sm">${DAMAGE_TYPES.map((t) => `<span style="--c:${AFF_COLOR[r.aff[t]]}"><small>${TYPE_ABBR[t]}</small><b>${AFF_WORD[r.aff[t]]}</b></span>`).join('')}</div>
			${r.immune.length ? `<p class="line">Immune to ${r.immune.join(', ')}</p>` : ''}
			<ul class="list">
				${attacks.map((a) => `<li><b>${esc(a.name)}</b> · ${a.range === 'ranged' ? 'ranged' : 'melee'} · (${ATTR_LABEL[a.attrs?.[0]] ?? '?'} + ${ATTR_LABEL[a.attrs?.[1]] ?? '?'}) +${r.acc} · (HR + ${(Number(a.hr) || 5) + r.extraDamage}) ${esc(a.type ?? 'physical')}${a.multi ? ` · multi (${a.multi})` : ''}</li>`).join('')}
				${r.spells.map((s) => `<li><b>${esc(s.name)}</b> · ${s.mp}${s.perTarget ? ' × T' : ''} MP</li>`).join('')}
				${r.skillItems.map((s) => `<li><b>${esc(s.name)}</b> · ${esc(s.text)}</li>`).join('')}
			</ul>
			${r.notes.length ? `<ul class="info">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
			${r.issues.length ? `<ul class="warn">${r.issues.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p class="ready">Ready to create.</p>'}
		</div>
		<footer>
			<button type="button" class="ghost" data-cact="reset" data-tooltip="Start over">Reset</button>
			<span class="sp"></span>
			<button type="button" class="gold" data-cact="create">Create</button>
			<button type="button" class="gold" data-cact="createAdd" data-tooltip="Create it and add it to the encounter">Create + add</button>
		</footer>`;
}

/**
 * Wire the Create tab. onChange redraws; onCreated gets the new actor.
 */
export function bindCreator(root, c, { onChange, onCreated, onReset }) {
	const set = (k, v) => {
		c[k] = v;
		onChange();
	};
	root.querySelectorAll('[data-cmethod]').forEach((el) =>
		el.addEventListener('click', () => {
			const m = el.dataset.cmethod;
			if (m === c.method) return;
			c.method = m;
			if (m === 'bestiary' && !QA_LEVELS.includes(Number(c.level))) c.level = QA_LEVELS.reduce((a, b) => (Math.abs(b - c.level) < Math.abs(a - c.level) ? b : a));
			onChange();
		}),
	);
	root.querySelectorAll('[data-c]').forEach((el) =>
		el.addEventListener('change', () => {
			const k = el.dataset.c;
			let v = el.type === 'checkbox' ? el.checked : el.value;
			if (['level', 'replaced'].includes(k)) v = Math.max(k === 'level' ? 5 : 2, Math.min(k === 'level' ? 60 : 6, Number(v) || 5));
			if (k === 'species') c.speciesPicks = [];
			set(k, v);
		}),
	);
	root.querySelectorAll('[data-trait]').forEach((el) => el.addEventListener('change', () => (c.traits[Number(el.dataset.trait)] = el.value)));
	root.querySelectorAll('[data-assign]').forEach((el) => el.addEventListener('change', () => ((c.assign[el.dataset.assign] = Number(el.value)), onChange())));
	root.querySelectorAll('[data-up]').forEach((el) => el.addEventListener('change', () => ((c.ups[el.dataset.up] = el.value), onChange())));
	root.querySelectorAll('[data-aff]').forEach((el) =>
		el.addEventListener('click', () => {
			const t = el.dataset.aff;
			const cur = computeCreature(c).aff[t] ?? '';
			c.aff = { ...c.aff, [t]: AFF_ORDER[(AFF_ORDER.indexOf(cur) + 1) % AFF_ORDER.length] };
			onChange();
		}),
	);
	root.querySelectorAll('[data-immune]').forEach((el) =>
		el.addEventListener('change', () => {
			const s = el.dataset.immune;
			c.immune = el.checked ? [...new Set([...(c.immune ?? []), s])] : (c.immune ?? []).filter((x) => x !== s);
			onChange();
		}),
	);
	root.querySelectorAll('[data-skill]').forEach((el) =>
		el.addEventListener('click', () => {
			const id = el.dataset.skill;
			if (Number(el.dataset.d) > 0) c.coreSkills = [...(c.coreSkills ?? []), { id }];
			else {
				const i = (c.coreSkills ?? []).map((p) => p.id).lastIndexOf(id);
				if (i >= 0) c.coreSkills.splice(i, 1);
			}
			onChange();
		}),
	);
	root.querySelectorAll('[data-alt]').forEach((el) =>
		el.addEventListener('change', () => {
			for (const p of c.coreSkills ?? []) if (p.id === el.dataset.alt) p.alt = el.checked;
			onChange();
		}),
	);
	const toggleIn = (key, id, on) => (c[key] = on ? [...new Set([...(c[key] ?? []), id])] : (c[key] ?? []).filter((x) => x !== id));
	root.querySelectorAll('[data-rskill]').forEach((el) => el.addEventListener('change', () => (toggleIn('roleSkills', el.dataset.rskill, el.checked), onChange())));
	root.querySelectorAll('[data-bskill]').forEach((el) => el.addEventListener('change', () => (toggleIn('bossSkills', el.dataset.bskill, el.checked), onChange())));
	root.querySelectorAll('[data-spell]').forEach((el) => el.addEventListener('change', () => (toggleIn('spells', el.dataset.spell, el.checked), onChange())));
	root.querySelectorAll('[data-spick]').forEach((el) => el.addEventListener('change', () => (toggleIn('speciesPicks', Number(el.dataset.spick), el.checked), onChange())));
	root.querySelectorAll('[data-role]').forEach((el) =>
		el.addEventListener('click', () => {
			c.role = el.dataset.role;
			c.roleSkills = [];
			c.custom = c.role === 'brute' ? 'hp' : c.role === 'mage' ? 'alt' : 'role';
			c.spells = [];
			onChange();
		}),
	);
	root.querySelectorAll('[data-atype]').forEach((el) =>
		el.addEventListener('change', () => {
			c.attackTypes = [...(c.attackTypes ?? [])];
			c.attackTypes[Number(el.dataset.atype)] = el.value;
			onChange();
		}),
	);
	root.querySelectorAll('.atk[data-atk]').forEach((row) =>
		row.querySelectorAll('[data-a]').forEach((el) =>
			el.addEventListener('change', () => {
				const a = c.attacks[Number(row.dataset.atk)];
				const k = el.dataset.a;
				if (k === 'a0' || k === 'a1') a.attrs[k === 'a0' ? 0 : 1] = el.value;
				else a[k] = el.value;
				onChange();
			}),
		),
	);
	root.querySelectorAll('[data-cact]').forEach((el) =>
		el.addEventListener('click', async () => {
			switch (el.dataset.cact) {
				case 'addatk':
					c.attacks = [...(c.attacks ?? []), { name: 'Attack', range: 'melee', attrs: ['dex', 'mig'], type: 'physical', hr: 5 }];
					return onChange();
				case 'delatk':
					c.attacks.splice(Number(el.dataset.i), 1);
					return onChange();
				case 'img': {
					const FP = foundry.applications.apps.FilePicker.implementation ?? foundry.applications.apps.FilePicker;
					return new FP({ type: 'image', current: c.img, callback: (path) => set('img', path) }).browse();
				}
				case 'reset':
					return onReset();
				case 'create':
				case 'createAdd': {
					const r = computeCreature(c);
					if (r.issues.length && !(await foundry.applications.api.DialogV2.confirm({ window: { title: 'Create anyway?' }, content: `<p>Still open:</p><ul>${r.issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` }))) return;
					let folder = game.folders.find((f) => f.type === 'Actor' && f.name === 'Created Creatures');
					folder ??= await Folder.create({ name: 'Created Creatures', type: 'Actor', color: '#3a6a8a' });
					const actor = await Actor.implementation.create(actorData(c, folder.id));
					ui.notifications.info(`Created ${actor.name}.`);
					return onCreated(actor, el.dataset.cact === 'createAdd');
				}
			}
		}),
	);
}

export { blankCreature };
