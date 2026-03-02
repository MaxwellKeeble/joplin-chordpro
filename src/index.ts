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
	const sectionLabelWeight = await joplin.settings.value('chordpro.sectionLabelWeight');
	const sectionLabelColor = await joplin.settings.value('chordpro.sectionLabelColor');
	const sectionLabelBorder = await joplin.settings.value('chordpro.sectionLabelBorder');
	const sectionLabelBorderColor = await joplin.settings.value('chordpro.sectionLabelBorderColor');
	const autoDetect = await joplin.settings.value('chordpro.autoDetect');

	const displayStyle = useInlineChords ? 'inline-block' : 'block';

	const cssContent = `
		:root {
			--chordpro-chord-color: ${chordColor};
			--chordpro-lyrics-color: ${lyricsColor};
			--chordpro-font-family: ${fontFamily};
			--chordpro-font-size: ${fontSize}px;
			--chordpro-columns: ${columns};
			--chordpro-section-label-weight: ${sectionLabelWeight};
			--chordpro-section-label-color: ${sectionLabelColor};
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

		.section-label {
			font-weight: var(--chordpro-section-label-weight);
			color: var(--chordpro-section-label-color);
		}

		/* Apply border only to named sections, excluding standard verses, comments, and unnamed text */
		.section:not(.section-verse):not(.section-comment):not(.section-text):not(.section-grid) {
			${sectionLabelBorder ? `
			border-style: solid;
			border-color: ${sectionLabelBorderColor};
			border-width: 1px 1px 1px 2px;
			padding: 6px;
			margin-bottom: 8px;` : ''}
		}

		/* Optional overrides to ensure section-title respects the label settings */
		.section-title {
			font-weight: inherit;
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

	const installationDir = await joplin.plugins.installationDir();
	const cssPath = path.join(installationDir, 'chordpro-dynamic.css');
	fs.writeFileSync(cssPath, cssContent, 'utf8');

	const settingsPath = path.join(installationDir, 'chordpro-settings.json');
	fs.writeFileSync(settingsPath, JSON.stringify({ autoDetect }), 'utf8');
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
			},
			'chordpro.sectionLabelWeight': {
				value: 'bold',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Section Label Font Weight',
				description: 'Font weight of section labels (e.g., normal, bold, 900)',
			},
			'chordpro.sectionLabelColor': {
				value: 'inherit',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Section Label Color',
				description: 'Color of the section label text',
			},
			'chordpro.sectionLabelBorder': {
				value: false,
				type: SettingItemType.Bool,
				section: 'chordproSettings',
				public: true,
				label: 'Enable Section Border',
				description: 'Display a border around the entire section',
			},
			'chordpro.sectionLabelBorderColor': {
				value: 'currentColor',
				type: SettingItemType.String,
				section: 'chordproSettings',
				public: true,
				label: 'Section Border Color',
				description: 'Color of the section border (if enabled)',
			},
			'chordpro.autoDetect': {
				value: true,
				type: SettingItemType.Bool,
				section: 'chordproSettings',
				public: true,
				label: 'Auto-detect ChordPro Files',
				description: 'Automatically render files containing ChordPro directives even if they are not inside a ```chordpro block (unless Markdown is also present).',
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

		// Register the markdownIt plugin
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'chordproRender',
			'./markdownItChordPro.js'
		);

		// Register the CodeMirror plugin
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'chordproCodeMirror',
			'./codeMirrorPlugin.js'
		);
	},
});
