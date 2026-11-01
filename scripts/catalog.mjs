/**
 * Every NPC the GM can put in an encounter: the world's own, and every Actor compendium (Project FU's NPCs and
 * any bestiary or atlas pack a module or the GM added). Read from compendium indexes, so nothing is imported
 * until it is placed on a scene.
 */

const FIELDS = ['img', 'type', 'folder', 'system.level.value', 'system.rank.value', 'system.rank.replacedSoldiers', 'system.species.value', 'system.villain.value', 'system.resources.hp.max', 'system.resources.mp.max', 'system.traits.value'];

let cache = null;

const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);

/** The top folder an entry sits in: packs are often split by book */
function rootFolder(folders, id) {
	let f = id ? folders?.get?.(id) : null;
	while (f?.folder) f = folders.get(f.folder.id ?? f.folder) ?? null;
	return f?.name ?? '';
}

function entry(data, { uuid, source, book }) {
	const species = String(get(data, 'system.species.value') ?? '');
	return {
		uuid,
		name: data.name,
		img: data.img || 'icons/svg/mystery-man.svg',
		level: Number(get(data, 'system.level.value')) || 0,
		rank: get(data, 'system.rank.value') || 'soldier',
		replaced: Number(get(data, 'system.rank.replacedSoldiers')) || 1,
		species,
		speciesLabel: species ? game.i18n.localize(CONFIG.FU?.species?.[species] ?? species) : '',
		villain: get(data, 'system.villain.value') || '',
		hp: Number(get(data, 'system.resources.hp.max')) || null,
		traits: String(get(data, 'system.traits.value') ?? ''),
		source,
		book: book || source,
	};
}

/**
 * @param {{refresh?: boolean, onProgress?: Function}} opts
 * @returns {Promise<object[]>}
 */
export async function loadCatalog({ refresh = false, onProgress } = {}) {
	if (cache && !refresh) return cache;
	const out = [];
	for (const a of game.actors ?? []) {
		if (a.type !== 'npc') continue;
		out.push(entry(a, { uuid: a.uuid, source: 'World', book: a.folder ? `World: ${rootFolder(game.folders, a.folder.id)}` : 'World' }));
	}
	const packs = [...(game.packs ?? [])].filter((p) => p.documentName === 'Actor' && (game.user.isGM || p.visible));
	let i = 0;
	for (const pack of packs) {
		onProgress?.(++i, packs.length, pack.metadata.label);
		try {
			const index = await pack.getIndex({ fields: FIELDS });
			for (const e of index) {
				if (e.type && e.type !== 'npc') continue;
				const book = rootFolder(pack.folders, e.folder);
				out.push(entry(e, { uuid: e.uuid ?? `Compendium.${pack.collection}.Actor.${e._id}`, source: pack.metadata.label, book: book ? `${pack.metadata.label}: ${book}` : pack.metadata.label }));
			}
		} catch (err) {
			console.warn(`fu-encounter-builder | could not read ${pack.collection}`, err);
		}
	}
	out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
	cache = out;
	return out;
}

export function clearCatalog() {
	cache = null;
}

/** The heroes: the active party's characters, else every player-owned character */
export function partyFromWorld() {
	let actors = [];
	try {
		const id = game.settings.get('projectfu', 'activeParty');
		const party = id ? game.actors.get(id) ?? fromUuidSync(id) : null;
		const uuids = [...(party?.system?.characters ?? [])];
		actors = uuids.map((u) => fromUuidSync(u)).filter(Boolean);
	} catch {
		actors = [];
	}
	if (!actors.length) actors = (game.actors ?? []).filter((a) => a.type === 'character' && a.hasPlayerOwner);
	const levels = actors.map((a) => Number(a.system?.level?.value) || 0).filter((n) => n > 0);
	const level = levels.length ? Math.round(levels.reduce((s, n) => s + n, 0) / levels.length) : 5;
	return { heroes: Math.max(1, actors.length || 4), level, names: actors.map((a) => a.name) };
}
