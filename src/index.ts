import joplin from 'api';
import { ContentScriptType, SettingItemType } from 'api/types';
import * as fs from 'fs';
import * as path from 'path';

async function updateDynamicCss() {
	const chordColor = await joplin.settings.value('chordpro.chordColor');
	const lyricsColor = await joplin.settings.value('chordpro.lyricsColor');
	const fontFamily = await joplin.settings.value('chordpro.fontFamily');
	const fontSize = await joplin.settings.value('chordpro.fontSize');
	const columns = await joplin.settings.value('chordpro.columns');
	const useInlineChords = await joplin.settings.value('chordpro.useInlineChords');

	const displayStyle = useInlineChords ? 'inline-block' : 'block';

	const cssContent = `
		:root {
			--chordpro-chord-color: ${chordColor};
			--chordpro-lyrics-color: ${lyricsColor};
			--chordpro-font-family: ${fontFamily};
			--chordpro-font-size: ${fontSize}px;
			--chordpro-columns: ${columns};
		}
		
		.chordpro-container {
			font-family: var(--chordpro-font-family);
			font-size: var(--chordpro-font-size);
			column-count: var(--chordpro-columns);
			column-gap: 2rem;
		}
		
		.chordpro-chord, .chord-inline, .chord {
			color: var(--chordpro-chord-color) !important;
			font-weight: bold;
		}
		
		.chordpro-lyric, .lyrics-line {
			color: var(--chordpro-lyrics-color);
		}

		${useInlineChords ? `
		.chord-line-container {
			display: inline;
		}
		.chord-line, .chord-spacer {
			display: inline;
		}
		.chord {
			display: inline-block;
			vertical-align: super;
			font-size: 0.75em;
			line-height: 0;
			margin-right: 0.1em;
		}
		.lyrics-line {
			display: inline;
		}
		` : `
		.chord-line-container {
			display: flex;
			flex-direction: column;
		}
		.chord-line {
			display: flex;
			flex-direction: row;
		}
		`}
	`;

	const cssPath = path.join(__dirname, 'chordpro-dynamic.css');
	fs.writeFileSync(cssPath, cssContent, 'utf8');
}

joplin.plugins.register({
	onStart: async function () {
		console.log('Chordpro plugin started');

		await joplin.settings.registerSection('chordproSettings', {
			label: 'ChordPro Renderer',
			iconName: 'fas fa-guitar',
		});

		await joplin.settings.registerSettings({
			'chordpro.chordColor': {
				value: '#E8612E',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Chord Color',
				description: 'Color of the chords (e.g., #E8612E, red, etc.)',
			},
			'chordpro.lyricsColor': {
				value: 'inherit',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Lyrics Color',
			},
			'chordpro.fontFamily': {
				value: 'monospace',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Font Family',
			},
			'chordpro.fontSize': {
				value: 16,
				type: SettingItemType.Int,
				section: 'chordproSettings',
				public: true,
				label: 'Font Size (px)',
			},
			'chordpro.useInlineChords': {
				value: false,
				type: SettingItemType.Bool,
				section: 'chordproSettings',
				public: true,
				label: 'Use Inline Chords',
			},
			'chordpro.columns': {
				value: 1,
				type: SettingItemType.Int,
				section: 'chordproSettings',
				public: true,
				label: 'Columns (for grid layout)',
			}
		});

		// Generate initial CSS
		await updateDynamicCss();

		// Listen to changes
		joplin.settings.onChange(async (event) => {
			if (event.keys.some(k => k.startsWith('chordpro.'))) {
				await updateDynamicCss();
			}
		});

		// Register the content script
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'chordproRender',
			'./markdownItChordPro.js'
		);
	},
});
