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

	let sectionStyles = '';
	const sectionTypes = ['verse', 'chorus', 'bridge', 'tab'];
	for (const sec of sectionTypes) {
		const showHeader = await joplin.settings.value(`chordpro.${sec}ShowHeader`);
		const headerColor = await joplin.settings.value(`chordpro.${sec}HeaderColor`);
		const fontColor = await joplin.settings.value(`chordpro.${sec}FontColor`);
		const secFontSize = await joplin.settings.value(`chordpro.${sec}FontSize`);
		const borderEnabled = await joplin.settings.value(`chordpro.${sec}BorderEnabled`);
		const borderColor = await joplin.settings.value(`chordpro.${sec}BorderColor`);
		const backgroundColor = await joplin.settings.value(`chordpro.${sec}BackgroundColor`);

		sectionStyles += `
		.section-${sec} {
			${backgroundColor !== 'transparent' ? `background-color: ${backgroundColor};` : ''}
			${fontColor !== 'inherit' && fontColor ? `--chordpro-lyrics-color: ${fontColor}; color: var(--chordpro-lyrics-color);` : ''}
			${secFontSize !== 'inherit' && secFontSize ? `font-size: ${secFontSize};` : ''}
			${borderEnabled ? `
			border-style: solid;
			border-color: ${borderColor};
			border-width: 1px 1px 1px 2px;
			padding: 6px;
			margin-bottom: 8px;` : ''}
		}
		${!showHeader ? `
		.section-${sec} .section-label {
			display: none !important;
		}` : ''}
		${headerColor !== 'inherit' && headerColor ? `
		.section-${sec} .section-label {
			color: ${headerColor} !important;
		}` : ''}
		`;
	}

	const commentSec = 'comment';
	const commFontColor = await joplin.settings.value(`chordpro.${commentSec}FontColor`);
	const commFontSize = await joplin.settings.value(`chordpro.${commentSec}FontSize`);
	const commBorderEnabled = await joplin.settings.value(`chordpro.${commentSec}BorderEnabled`);
	const commBorderColor = await joplin.settings.value(`chordpro.${commentSec}BorderColor`);
	const commBackgroundColor = await joplin.settings.value(`chordpro.${commentSec}BackgroundColor`);

	sectionStyles += `
	.section-${commentSec} {
		${commBackgroundColor !== 'transparent' ? `background-color: ${commBackgroundColor};` : ''}
		${commFontColor !== 'inherit' && commFontColor ? `--chordpro-lyrics-color: ${commFontColor}; color: var(--chordpro-lyrics-color);` : ''}
		${commFontSize !== 'inherit' && commFontSize ? `font-size: ${commFontSize};` : ''}
		${commBorderEnabled ? `
		border-style: solid;
		border-color: ${commBorderColor};
		border-width: 1px 1px 1px 2px;
		padding: 6px;
		margin-bottom: 8px;` : ''}
	}
	`;

	const displayStyle = useInlineChords ? 'inline-block' : 'block';

	const cssContent = `
		:root {
			--chordpro-chord-color: ${chordColor};
			--chordpro-lyrics-color: ${lyricsColor};
			--chordpro-font-family: ${fontFamily};
			--chordpro-font-size: ${fontSize};
			--chordpro-columns: ${columns};
			--chordpro-section-label-weight: ${sectionLabelWeight};
			--chordpro-section-label-color: ${sectionLabelColor};
		}
		
		.chordpro-song {
			font-size: var(--chordpro-font-size);
			column-count: var(--chordpro-columns);
			column-gap: 2rem;
		}

		.chordpro-song .section {
			font-family: var(--chordpro-font-family);
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

		${sectionStyles}

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
		await joplin.settings.registerSection('chordproSettings', {
			label: 'ChordPro options',
			iconName: 'fas fa-guitar',
		});

		await joplin.settings.registerSection('chordproFormatSettings', {
			label: 'ChordPro styles',
			iconName: 'fas fa-palette',
			description: 'Customize the appearance of individual ChordPro sections.',
		});

		const settingsParams: Record<string, any> = {
			// ============================================
			// 1. General Options (chordproSettings)
			// ============================================
			'chordpro.autoDetect': {
				value: true,
				type: SettingItemType.Bool,
				section: 'chordproSettings',
				public: true,
				label: 'Auto-detect ChordPro Files',
				description: 'Automatically render files containing ChordPro directives even if they are not inside a ```chordpro block (unless Markdown is also present).',
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

			// ============================================
			// 2. Styling Options (chordproFormatSettings)
			// ============================================
			'chordpro.chordColor': {
				value: '#E8612E',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Chord Color',
				description: 'Color of the chords (e.g., #E8612E, red, etc.)',
			},
			'chordpro.lyricsColor': {
				value: 'inherit',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Lyrics Color',
			},
			'chordpro.fontFamily': {
				value: 'monospace',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Font Family',
			},
			'chordpro.fontSize': {
				value: 'inherit',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Font Size',
				description: 'Font size (e.g. 16px, 1.2em, inherit)',
			},
			'chordpro.sectionLabelWeight': {
				value: 'bold',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Section Label Font Weight',
				description: 'Font weight of section labels (e.g., normal, bold, 900)',
			},
			'chordpro.sectionLabelColor': {
				value: 'inherit',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Section Label Color',
				description: 'Color of the section label text',
			},
			'chordpro.sectionLabelBorder': {
				value: false,
				type: SettingItemType.Bool,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Enable Section Border',
				description: 'Display a border around the entire section',
			},
			'chordpro.sectionLabelBorderColor': {
				value: 'currentColor',
				type: SettingItemType.String,
				section: 'chordproFormatSettings',
				public: true,
				label: 'Section Border Color',
				description: 'Color of the section border (if enabled)',
			},
		};

		const sections = ['verse', 'chorus', 'bridge', 'tab'];
		for (const sec of sections) {
			const capitalized = sec.charAt(0).toUpperCase() + sec.slice(1);
			settingsParams[`chordpro.${sec}ShowHeader`] = {
				value: true, type: SettingItemType.Bool, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Show Header`
			};
			settingsParams[`chordpro.${sec}HeaderColor`] = {
				value: 'inherit', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Header Color`
			};
			settingsParams[`chordpro.${sec}FontSize`] = {
				value: 'inherit', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Font Size`
			};
			settingsParams[`chordpro.${sec}FontColor`] = {
				value: 'inherit', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Font Color`
			};
			settingsParams[`chordpro.${sec}BorderEnabled`] = {
				value: false, type: SettingItemType.Bool, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Enable Border`
			};
			settingsParams[`chordpro.${sec}BorderColor`] = {
				value: 'currentColor', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Border Color`
			};
			settingsParams[`chordpro.${sec}BackgroundColor`] = {
				value: 'transparent', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[${capitalized}] Background Color`
			};
		}

		// Comments don't have headers
		const commentSec = 'comment';
		settingsParams[`chordpro.${commentSec}FontSize`] = {
			value: 'inherit', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[Comment] Font Size`
		};
		settingsParams[`chordpro.${commentSec}FontColor`] = {
			value: 'inherit', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[Comment] Font Color`
		};
		settingsParams[`chordpro.${commentSec}BorderEnabled`] = {
			value: true, type: SettingItemType.Bool, section: 'chordproFormatSettings', public: true, label: `[Comment] Enable Border`
		};
		settingsParams[`chordpro.${commentSec}BorderColor`] = {
			value: 'currentColor', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[Comment] Border Color`
		};
		settingsParams[`chordpro.${commentSec}BackgroundColor`] = {
			value: 'transparent', type: SettingItemType.String, section: 'chordproFormatSettings', public: true, label: `[Comment] Background Color`
		};

		await joplin.settings.registerSettings(settingsParams);

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
