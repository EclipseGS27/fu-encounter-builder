const FOLDER = 'Encounter Builder';

/** A world actor for a catalog entry: itself, one already imported from the same compendium entry, or a new import */
async function worldActor(uuid) {
	const doc = await fromUuid(uuid);
	if (!doc) return null;
	if (!doc.pack) return doc;
	const existing = game.actors.find((a) => a._stats?.compendiumSource === uuid || a.flags?.core?.sourceId === uuid);
	if (existing) return existing;
	let folder = game.folders.find((f) => f.type === 'Actor' && f.name === FOLDER);
	folder ??= await Folder.create({ name: FOLDER, type: 'Actor', color: '#5a3a8a' });
	return game.actors.importFromCompendium(game.packs.get(doc.pack), doc.id, { folder: folder.id });
}

/** Free spots in a loose formation, facing the party from the right of the view */
function formation(n, sizes) {
	const gs = canvas.grid.size;
	// the middle of what the GM is looking at
	const view = { x: canvas.stage.pivot.x, y: canvas.stage.pivot.y };
	const cols = Math.ceil(Math.sqrt(n));
	const startX = view.x + gs * 2;
	const startY = view.y - ((Math.ceil(n / cols) - 1) * gs * 1.5) / 2;
	const out = [];
	let x = startX;
	let y = startY;
	let col = 0;
	let rowH = 0;
	for (let i = 0; i < n; i++) {
		const s = sizes[i] ?? 1;
		// stagger the rows a little, like a JRPG enemy line
		out.push({ x: x + (Math.floor(i / cols) % 2 ? gs * 0.5 : 0), y });
		x += gs * (s + 0.5);
		rowH = Math.max(rowH, s);
		if (++col >= cols) {
			col = 0;
			x = startX;
			y += gs * (rowH + 0.5);
			rowH = 0;
		}
	}
	return out.map((p) => canvas.grid.getSnappedPoint?.(p, { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_VERTEX }) ?? p);
}

/**
 * Put the encounter on the current scene.
 * @param {{npc:object, qty:number}[]} entries
 * @param {{combat?: boolean, hidden?: boolean}} opts
 */
export async function placeEncounter(entries, { combat = false, hidden = false } = {}) {
	if (!canvas?.scene) return ui.notifications.warn('Open a scene first.');
	const actors = [];
	for (const { npc, qty } of entries) {
		const actor = await worldActor(npc.uuid);
		if (!actor) {
			ui.notifications.warn(`Couldn't find ${npc.name}.`);
			continue;
		}
		for (let i = 0; i < qty; i++) actors.push(actor);
	}
	if (!actors.length) return;
	const sizes = actors.map((a) => Math.max(a.prototypeToken?.width ?? 1, a.prototypeToken?.height ?? 1));
	const spots = formation(actors.length, sizes);
	const data = [];
	for (let i = 0; i < actors.length; i++) {
		const td = await actors[i].getTokenDocument({ x: spots[i].x, y: spots[i].y, hidden, disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE });
		data.push(td.toObject());
	}
	// several of the same foe: number them (Goblin 1, Goblin 2)
	const seen = {};
	const total = {};
	for (const d of data) total[d.name] = (total[d.name] ?? 0) + 1;
	for (const d of data) if (total[d.name] > 1) d.name = `${d.name} ${(seen[d.name] = (seen[d.name] ?? 0) + 1)}`;
	const tokens = await canvas.scene.createEmbeddedDocuments('Token', data);
	if (combat && tokens.length) {
		let c = game.combats.find((x) => x.scene?.id === canvas.scene.id && !x.started) ?? game.combat;
		c ??= await Combat.implementation.create({ scene: canvas.scene.id, active: true });
		await c.createEmbeddedDocuments('Combatant', tokens.map((t) => ({ tokenId: t.id, sceneId: canvas.scene.id, actorId: t.actorId, hidden })));
	}
	ui.notifications.info(`Placed ${tokens.length} ${tokens.length === 1 ? 'foe' : 'foes'}${combat ? ' and added them to the combat' : ''}.`);
	return tokens;
}
