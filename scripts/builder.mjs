import { DIFFICULTIES, PICKABLE, RANK_LABEL, ROLES, RULES, SHAPES, evaluate, levelBand, rankText, rankWeight, suggest } from './rules.mjs';
import { clearCatalog, loadCatalog, partyFromWorld } from './catalog.mjs';
import { bindCreator, blankCreature, creatorHTML } from './creator-ui.mjs';
import { placeEncounter } from './place.mjs';

export const MODULE_ID = 'fu-encounter-builder';
const { ApplicationV2 } = foundry.applications.api;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const setting = (k) => game.settings.get(MODULE_ID, k);
const DIFF = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Encounter builder: the party on the left with the encounter and how hard it is, every creature from every
 * book on the right. Click a creature to add it; Suggest builds one for the difficulty you pick.
 */
export class EncounterBuilder extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: 'fu-encounter-builder',
		classes: ['fue-app'],
		window: { title: 'Encounter Builder', icon: 'fa-solid fa-dragon', resizable: true },
		position: { width: 1040, height: 760 },
	};

	static open() {
		if (!game.user.isGM) return ui.notifications.warn('Only the GM can build encounters.');
		const app = foundry.applications.instances.get('fu-encounter-builder') ?? new EncounterBuilder();
		return app.render({ force: true });
	}

	constructor(options = {}) {
		super(options);
		const auto = partyFromWorld();
		this.party = { heroes: auto.heroes, allies: 0, level: auto.level, names: auto.names, manual: false };
		this.method = setting('method') || 'core';
		this.difficulty = 'normal';
		this.shape = 'balanced';
		/** @type {Map<string, {npc:object, qty:number}>} */
		this.entries = new Map();
		this.catalog = null;
		this.filters = { q: '', book: '', rank: '', role: '', near: true, villains: false };
		this.combat = true;
		this.hidden = false;
		this.tab = 'encounter';
		this.creature = blankCreature(this.method);
	}

	get list() {
		return [...this.entries.values()];
	}

	/* ---------------- rendering ---------------- */

	async _renderHTML() {
		const root = document.createElement('div');
		root.className = 'fue-root';
		root.innerHTML = `<nav class="fue-tabs">${[
			['encounter', 'fa-dragon', 'Build an encounter'],
			['create', 'fa-hammer', 'Create a creature'],
		]
			.map(([id, icon, label]) => `<button type="button" class="${this.tab === id ? 'on' : ''}" data-tab="${id}"><i class="fa-solid ${icon}"></i> ${label}</button>`)
			.join('')}</nav>`;
		const div = document.createElement('div');
		if (this.tab === 'create') {
			div.className = 'fueb fue-create';
			div.innerHTML = creatorHTML(this.creature);
		} else {
			div.className = 'fueb';
			div.innerHTML = `<section class="left">${this.#leftHTML()}</section><section class="right">${this.#rightHTML()}</section>`;
		}
		root.append(div);
		return root;
	}

	/** Redraw the Create tab in place, keeping the form's scroll */
	#refreshCreate() {
		const box = this.element?.querySelector('.fue-create');
		if (!box) return this.render();
		const top = box.querySelector('.cform')?.scrollTop ?? 0;
		box.innerHTML = creatorHTML(this.creature);
		box.querySelector('.cform').scrollTop = top;
		this.#bindCreate(box);
	}

	#bindCreate(box) {
		bindCreator(box, this.creature, {
			onChange: () => this.#refreshCreate(),
			onReset: () => {
				this.creature = blankCreature(this.creature.method);
				this.#refreshCreate();
			},
			onCreated: async (actor, addToEncounter) => {
				actor.sheet?.render(true);
				clearCatalog();
				this.catalog = null;
				if (!addToEncounter) return;
				this.catalog = await loadCatalog();
				const npc = this.catalog.find((x) => x.uuid === actor.uuid);
				this.tab = 'encounter';
				if (npc) this.#add(npc, 1);
				else this.render();
			},
		});
	}

	_replaceHTML(result, content) {
		content.replaceChildren(result);
	}

	#leftHTML() {
		const ev = evaluate(this.list, this.party);
		const shape = SHAPES[this.shape] ?? SHAPES.balanced;
		const saved = setting('saved') ?? {};
		const rate = ev.rating ? DIFF[ev.rating] : null;
		return `
			<div class="party">
				<div class="hd"><b>Party</b>${this.party.names?.length && !this.party.manual ? `<small>${esc(this.party.names.join(', '))}</small>` : '<small>Set by hand</small>'}</div>
				<div class="nums">
					<label><span>Heroes</span><input type="number" min="1" max="12" data-party="heroes" value="${this.party.heroes}"></label>
					<label data-tooltip="Helpful NPCs who take their own full turns count as extra heroes"><span>Allies</span><input type="number" min="0" max="8" data-party="allies" value="${this.party.allies ?? 0}"></label>
					<label data-tooltip="The highest level among the heroes"><span>Party Level</span><input type="number" min="1" max="60" data-party="level" value="${this.party.level}"></label>
					<button type="button" class="ghost" data-act="reparty" data-tooltip="Read the active party again"><i class="fa-solid fa-rotate"></i></button>
				</div>
			</div>

			<details class="rules" ${this.rulesOpen ? 'open' : ''}><summary>${esc(RULES.label)}: how the count works</summary><p class="blurb">${esc(RULES.blurb)}</p></details>

			<div class="meter">
				<div class="row"><b class="rating" style="--c:${rate?.color ?? '#8aa0b8'}">${rate ? esc(rate.label) : 'Empty'}</b><span>${ev.count ? `${ev.count} ${ev.count === 1 ? 'foe' : 'foes'} · ${fmt(ev.total)} ${esc(ev.unit)}` : 'Add creatures from the list'}</span></div>
				<div class="bar">
					${PICKABLE.map((k) => `<i class="mark" style="left:${ev.meter.marks[k]}%;--c:${DIFF[k].color}" data-tooltip="${DIFF[k].label}: ${ev.bands[k]}"></i>`).join('')}
					<span class="fill" style="width:${ev.meter.pct}%;--c:${rate?.color ?? '#8aa0b8'}"></span>
				</div>
				<div class="legend">${PICKABLE.map((k) => `<span style="--c:${DIFF[k].color}">${DIFF[k].label} ${ev.bands[k]}</span>`).join('')}</div>
			</div>

			<div class="enc">
				${
					this.list.length
						? this.list
								.map(
									({ npc, qty }) => `<div class="foe" data-uuid="${esc(npc.uuid)}">
							<img src="${esc(npc.img)}" alt="" loading="lazy">
							<div class="d"><b>${esc(npc.name)}</b><small><span class="lvb ${levelBand(npc.level, this.party.level).id}" data-tooltip="${esc(levelBand(npc.level, this.party.level).label)}">Lv ${npc.level}</span> · <span class="rk ${npc.rank}">${esc(rankText(npc))}</span>${npc.role ? ` · <span class="role">${esc(npc.role)}</span>` : ''}${npc.villain ? ` · <span class="vil">${typeof npc.villain === 'string' ? esc(npc.villain) : ''} villain</span>` : ''}</small></div>
							<div class="qty"><button type="button" data-qty="-1" aria-label="One fewer">−</button><b>${qty}</b><button type="button" data-qty="1" aria-label="One more">+</button></div>
							<span class="w" data-tooltip="Soldiers (enemy turns per round)">${rankWeight(npc) * qty}</span>
						</div>`,
								)
								.join('')
						: '<p class="empty">No foes yet. Click creatures on the right, or let Suggest build one.</p>'
				}
			</div>
			${ev.warnings.length ? `<ul class="warn">${ev.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
			${ev.notes.length ? `<ul class="info">${ev.notes.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}

			<div class="suggest">
				<div class="seg small">${PICKABLE.map((k) => `<button type="button" class="${k === this.difficulty ? 'on' : ''}" data-diff="${k}" style="--c:${DIFF[k].color}">${DIFF[k].label}</button>`).join('')}</div>
				<button type="button" class="gold" data-act="suggest" data-tooltip="A random encounter of this shape and difficulty from the creatures shown on the right"><i class="fa-solid fa-dice"></i> Suggest</button>
			</div>
			<div class="shape">
				<label><span class="cap">Shape</span><select data-act="shape" aria-label="Encounter shape">${Object.entries(SHAPES)
					.map(([id, x]) => `<option value="${id}" ${id === (this.shape ?? 'balanced') ? 'selected' : ''}>${esc(x.label)}</option>`)
					.join('')}</select></label>
				<p class="blurb">${esc(shape.desc)}</p>
			</div>

			<div class="saved">
				<select data-act="load" aria-label="Saved encounters"><option value="">Saved encounters…</option>${Object.keys(saved)
					.sort()
					.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`)
					.join('')}</select>
				<button type="button" class="ghost" data-act="save" ${this.list.length ? '' : 'disabled'} data-tooltip="Save this encounter"><i class="fa-solid fa-floppy-disk"></i></button>
				<button type="button" class="ghost" data-act="delete" data-tooltip="Delete the selected saved encounter"><i class="fa-solid fa-trash"></i></button>
				<button type="button" class="ghost" data-act="clear" ${this.list.length ? '' : 'disabled'} data-tooltip="Remove every foe"><i class="fa-solid fa-xmark"></i></button>
			</div>

			<footer>
				<label><input type="checkbox" data-opt="combat" ${this.combat ? 'checked' : ''}> Add to combat</label>
				<label><input type="checkbox" data-opt="hidden" ${this.hidden ? 'checked' : ''}> Hidden</label>
				<span class="sp"></span>
				<button type="button" class="gold big" data-act="place" ${this.list.length ? '' : 'disabled'}><i class="fa-solid fa-chess-knight"></i> Place on scene</button>
			</footer>`;
	}

	#rightHTML() {
		if (!this.catalog) return '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> <span>Reading the bestiaries…</span></div>';
		const books = [...new Set(this.catalog.map((c) => c.book))].sort();
		const f = this.filters;
		return `
			<div class="filters">
				<input type="search" data-f="q" placeholder="Search name, species or traits" value="${esc(f.q)}" aria-label="Search creatures">
				<div class="row">
					<select data-f="book" aria-label="Book">${['', ...books].map((b) => `<option value="${esc(b)}" ${b === f.book ? 'selected' : ''}>${b ? esc(b) : 'Every book'}</option>`).join('')}</select>
					<select data-f="rank" aria-label="Rank"><option value="">Any rank</option>${Object.entries(RANK_LABEL).map(([k, l]) => `<option value="${k}" ${k === f.rank ? 'selected' : ''}>${l}</option>`).join('')}</select>
					<select data-f="role" aria-label="Role" data-tooltip="Bestiary roles"><option value="">Any role</option>${ROLES.map((k) => `<option value="${k}" ${k === f.role ? 'selected' : ''}>${k[0].toUpperCase()}${k.slice(1)}</option>`).join('')}</select>
				</div>
				<div class="row checks">
					<label><input type="checkbox" data-f="near" ${f.near ? 'checked' : ''}> Within 5 levels of the party</label>
					<label><input type="checkbox" data-f="villains" ${f.villains ? 'checked' : ''}> Villains only</label>
					<span class="count"></span>
				</div>
			</div>
			<div class="cat">${this.catalog
				.map(
					(c, i) => `<button type="button" class="cr" data-i="${i}" data-search="${esc(`${c.name} ${c.speciesLabel} ${c.traits} ${c.book} ${c.role} ${c.group ?? ''}`.toLowerCase())}">
					<img src="${esc(c.img)}" alt="" loading="lazy">
					<span class="d"><b>${esc(c.name)}${c.group ? ` <em class="part" data-tooltip="One profile of a several-part adversary: Suggest adds all of its parts together">part of ${esc(c.group)}</em>` : ''}</b><small>${esc(c.speciesLabel || 'Creature')}${c.role ? ` · <span class="role">${esc(c.role)}</span>` : ''} · ${esc(c.book)}</small></span>
					<span class="lv">Lv ${c.level}</span>
					<span class="rk ${c.rank}">${esc(rankText(c))}</span>
					<i class="fa-solid fa-plus add"></i>
				</button>`,
				)
				.join('')}</div>`;
	}

	/** Which creatures pass the filters (the list is filtered in place, so typing never re-draws it) */
	#visible(c) {
		const f = this.filters;
		if (f.book && c.book !== f.book) return false;
		if (f.rank && c.rank !== f.rank) return false;
		if (f.role && c.role !== f.role) return false;
		if (f.villains && !c.villain) return false;
		if (f.near && Math.abs(c.level - this.party.level) > 5) return false;
		const q = f.q.trim().toLowerCase();
		if (q && !`${c.name} ${c.speciesLabel} ${c.traits} ${c.book} ${c.role}`.toLowerCase().includes(q)) return false;
		return true;
	}

	#applyFilters() {
		const root = this.element;
		if (!root || !this.catalog) return;
		let n = 0;
		for (const el of root.querySelectorAll('.cat .cr')) {
			const show = this.#visible(this.catalog[Number(el.dataset.i)]);
			el.hidden = !show;
			n += show;
		}
		const count = root.querySelector('.filters .count');
		if (count) count.textContent = `${n} shown`;
	}

	/** Re-draw only the left side (the creature list keeps its scroll and search) */
	#refreshLeft() {
		const left = this.element?.querySelector('section.left');
		if (!left) return this.render();
		left.innerHTML = this.#leftHTML();
		this.#bindLeft(left);
	}

	/* ---------------- events ---------------- */

	async _onRender() {
		const root = this.element;
		// Only the panels scroll. If the browser ever scrolls the frame itself (focus jumping to a hidden box),
		// put it back at once, or the window shows an empty panel that nothing can scroll away.
		if (!this.scrollGuard) {
			this.scrollGuard = true;
			const wc = root.querySelector('.window-content');
			wc?.addEventListener('scroll', () => (wc.scrollTop = wc.scrollLeft = 0));
			root.addEventListener('scroll', () => (root.scrollTop = root.scrollLeft = 0));
		}
		root.querySelectorAll('.fue-tabs [data-tab]').forEach((el) =>
			el.addEventListener('click', () => {
				if (this.tab === el.dataset.tab) return;
				this.tab = el.dataset.tab;
				this.render();
			}),
		);
		if (this.tab === 'create') return this.#bindCreate(root.querySelector('.fue-create'));
		this.#bindLeft(root.querySelector('section.left'));
		this.#bindRight(root.querySelector('section.right'));
		if (!this.catalog && !this._loading) {
			this._loading = true;
			this.catalog = await loadCatalog({
				onProgress: (i, n, label) => {
					const s = this.element?.querySelector('.loading span');
					if (s) s.textContent = `Reading ${label} (${i}/${n})…`;
				},
			});
			this._loading = false;
			const right = this.element?.querySelector('section.right');
			if (right) {
				right.innerHTML = this.#rightHTML();
				this.#bindRight(right);
			}
		}
	}

	#bindRight(right) {
		if (!right || !this.catalog) return;
		right.querySelectorAll('[data-f]').forEach((el) =>
			el.addEventListener(el.type === 'search' ? 'input' : 'change', () => {
				this.filters[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value;
				this.#applyFilters();
			}),
		);
		right.querySelector('.cat')?.addEventListener('click', (ev) => {
			const el = ev.target.closest('.cr');
			if (!el) return;
			this.#add(this.catalog[Number(el.dataset.i)], 1);
		});
		right.querySelector('.cat')?.addEventListener('contextmenu', async (ev) => {
			const el = ev.target.closest('.cr');
			if (!el) return;
			ev.preventDefault();
			(await fromUuid(this.catalog[Number(el.dataset.i)].uuid))?.sheet?.render(true);
		});
		this.#applyFilters();
	}

	#bindLeft(left) {
		if (!left) return;
		left.querySelectorAll('[data-party]').forEach((el) =>
			el.addEventListener('change', () => {
				this.party[el.dataset.party] = Math.max(el.dataset.party === 'allies' ? 0 : 1, Number(el.value) || 0);
				this.party.manual = true;
				this.#refreshLeft();
				this.#applyFilters();
			}),
		);
		left.querySelector('details.rules')?.addEventListener('toggle', (ev) => (this.rulesOpen = ev.target.open));
		left.querySelectorAll('[data-diff]').forEach((el) =>
			el.addEventListener('click', () => {
				this.difficulty = el.dataset.diff;
				this.#refreshLeft();
			}),
		);
		left.querySelectorAll('.foe [data-qty]').forEach((el) =>
			el.addEventListener('click', () => {
				const uuid = el.closest('.foe').dataset.uuid;
				const e = this.entries.get(uuid);
				if (e) this.#add(e.npc, Number(el.dataset.qty));
			}),
		);
		left.querySelectorAll('.foe img').forEach((el) =>
			el.addEventListener('click', async () => (await fromUuid(el.closest('.foe').dataset.uuid))?.sheet?.render(true)),
		);
		left.querySelectorAll('[data-opt]').forEach((el) => el.addEventListener('change', () => (this[el.dataset.opt] = el.checked)));
		left.querySelectorAll('[data-act]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'click', () => this.#act(el.dataset.act, el)));
	}

	#add(npc, n) {
		const e = this.entries.get(npc.uuid) ?? { npc, qty: 0 };
		e.qty = Math.max(0, Math.min(20, e.qty + n));
		if (e.qty) this.entries.set(npc.uuid, e);
		else this.entries.delete(npc.uuid);
		this.#refreshLeft();
	}

	async #act(act, el) {
		switch (act) {
			case 'reparty': {
				const p = partyFromWorld();
				this.party = { ...p, manual: false };
				this.#refreshLeft();
				return this.#applyFilters();
			}
			case 'shape':
				this.shape = el.value;
				return this.#refreshLeft();
			case 'suggest': {
				if (!this.catalog) return;
				const pool = this.catalog.filter((c) => this.#visible(c));
				if (!pool.length) return ui.notifications.warn('No creatures match the filters on the right.');
				const got = suggest(pool, this.party, this.difficulty, this.shape ?? 'balanced');
				if (!got.length) {
					ui.notifications.warn(`No ${(SHAPES[this.shape] ?? SHAPES.balanced).label.toLowerCase()} fits a ${this.difficulty} fight from the creatures shown. Widen the filters on the right, or try another shape.`);
					return;
				}
				this.entries = new Map(got.map((e) => [e.npc.uuid, e]));
				return this.#refreshLeft();
			}
			case 'clear':
				this.entries.clear();
				return this.#refreshLeft();
			case 'place':
				await placeEncounter(this.list, { combat: this.combat, hidden: this.hidden });
				return;
			case 'save': {
				const name = await foundry.applications.api.DialogV2.prompt({
					window: { title: 'Save encounter' },
					content: '<label>Name <input type="text" name="name" autofocus></label>',
					ok: { label: 'Save', callback: (ev, button) => button.form.elements.name.value.trim() },
					rejectClose: false,
				});
				if (!name) return;
				const saved = foundry.utils.deepClone(setting('saved') ?? {});
				saved[name] = { method: this.method, party: { heroes: this.party.heroes, allies: this.party.allies, level: this.party.level }, foes: this.list.map(({ npc, qty }) => ({ npc, qty })) };
				await game.settings.set(MODULE_ID, 'saved', saved);
				ui.notifications.info(`Saved “${name}”.`);
				return this.#refreshLeft();
			}
			case 'load': {
				const s = (setting('saved') ?? {})[el.value];
				if (!s) return;
				this.entries = new Map(s.foes.map((e) => [e.npc.uuid, { npc: e.npc, qty: e.qty }]));
				this.#refreshLeft();
				const sel = this.element.querySelector('[data-act="load"]');
				if (sel) sel.value = el.value;
				return;
			}
			case 'delete': {
				const sel = this.element.querySelector('[data-act="load"]');
				const name = sel?.value;
				if (!name) return ui.notifications.info('Pick a saved encounter first.');
				const saved = foundry.utils.deepClone(setting('saved') ?? {});
				delete saved[name];
				await game.settings.set(MODULE_ID, 'saved', saved);
				return this.#refreshLeft();
			}
		}
	}
}
