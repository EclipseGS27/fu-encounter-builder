import { EncounterBuilder, MODULE_ID } from './builder.mjs';
import { clearCatalog } from './catalog.mjs';
import * as rules from './rules.mjs';

Hooks.once('init', () => {
	game.settings.register(MODULE_ID, 'method', { scope: 'client', config: false, type: String, default: 'core' });
	game.settings.register(MODULE_ID, 'saved', { scope: 'world', config: false, type: Object, default: {} });
	game.keybindings.register(MODULE_ID, 'open', {
		name: 'Open the encounter builder',
		editable: [{ key: 'KeyE', modifiers: ['Shift'] }],
		restricted: true,
		onDown: () => {
			EncounterBuilder.open();
			return true;
		},
	});
	game.modules.get(MODULE_ID).api = { open: () => EncounterBuilder.open(), rules, EncounterBuilder };
});

/* the dragon button in the Token controls (GM only) */
Hooks.on('getSceneControlButtons', (controls) => {
	if (!game.user?.isGM) return;
	try {
		const tokens = controls.tokens ?? controls.token;
		if (tokens?.tools && !Array.isArray(tokens.tools)) {
			tokens.tools.fueBuilder = { name: 'fueBuilder', title: 'Encounter Builder (Shift+E)', icon: 'fa-solid fa-dragon', button: true, order: 60, visible: true, onChange: () => EncounterBuilder.open() };
		}
	} catch (err) {
		console.warn(`${MODULE_ID} | scene control`, err);
	}
});

/* and a button at the top of the Actors sidebar */
Hooks.on('renderActorDirectory', (app, html) => {
	if (!game.user.isGM) return;
	const root = html instanceof HTMLElement ? html : html?.[0];
	const header = root?.querySelector('.header-actions, .directory-header .action-buttons');
	if (!header || header.querySelector('.fue-open')) return;
	const b = document.createElement('button');
	b.type = 'button';
	b.className = 'fue-open';
	b.innerHTML = '<i class="fa-solid fa-dragon"></i> Encounter Builder';
	b.addEventListener('click', () => EncounterBuilder.open());
	header.append(b);
});

/* new or changed NPCs show up the next time the builder opens */
for (const h of ['createActor', 'deleteActor', 'updateActor', 'updateCompendium']) Hooks.on(h, (doc) => (doc?.type === 'npc' || h === 'updateCompendium') && clearCatalog());
