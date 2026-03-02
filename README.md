# Joplin ChordPro Plugin

This plugin for Joplin renders ChordPro files, a popular text format for writing and formatting chord charts and lyrics.

## Features

- **Code Block Rendering**: Use standard Markdown ````chordpro` code blocks to format a chord sheet.
- **Auto-Detection**: The plugin can automatically detect and render pure ChordPro notes, even without the markdown code block. This auto-detection behavior can be toggled in settings.
- **Syntax Highlighting**: Real-time syntax highlighting for ChordPro directives, chords, and sections within the Joplin markdown editor. Also autocomplete for key directives and chords in use.
- **Customizable Styling**: Configure colors, fonts, and layout options directly within Joplin settings, which automatically updates the look dynamically.

## Usage

You can create a new note with a ````chordpro` code block:

```chordpro
{title: Amazing Grace}
{artist: John Newton}

[G]Amazing grace! How [C]sweet the [G]sound
That saved a wretch like [D]me!
I [G]once was lost, but [C]now am [G]found;
Was blind, but [D]now I [G]see.
```

Or omit the code block entirely if the entire note is written in ChordPro syntax and auto-detect is enabled!

## Settings

Settings are split into two sections: **Options > ChordPro Renderer** for global settings, and **Options > ChordPro Formatting** for section-specific styling.

### ChordPro Renderer

- **Chord Color**: Custom color for all chords (e.g., `#E8612E`, `red`, etc.). Default is `#E8612E`.
- **Lyrics Color**: Custom color for lyrics. Default is `inherit`.
- **Font Family**: Customize the font family for rendering. Default is `monospace`.
- **Font Size (px)**: Base font size. Default is `16`.
- **Use Inline Chords**: Check this to render chords inline with the lyrics via subscript styling, rather than placing them on the line above the lyrics.
- **Columns**: Set to a value greater than 1 to use a multi-column grid layout for chord charts.
- **Section Label Font Weight**: Font weight of section labels (e.g., `normal`, `bold`, `900`). Default is `bold`.
- **Section Label Color**: Color of the section label text. Default is `inherit`.
- **Enable Section Border**: Display a border around the entire section with a customizable color and layout (2px left border, 1px all other sides, 6px padding).
- **Section Border Color**: Color of the section border (if enabled). Default is `currentColor`.
- **Auto-detect ChordPro Files**: Automatically render files containing ChordPro directives even if they are not inside a \`\`\`chordpro block (unless Markdown is also present).

### ChordPro Formatting

Customize the appearance of individual ChordPro sections (Verse, Chorus, Bridge, Tab, and Comment).

- **Show Header**: Whether to display the section's semantic label (N/A for comments).
- **Header Color**: Color of the section's heading (N/A for comments).
- **Font Size**: Specific font size for this section. Set to 0 to inherit from the global setting.
- **Font Color**: Specific font color for lyrics/text in this section.
- **Enable Border**: Toggle a specialized border indicating the section block.
- **Border Color**: Color of the section's border.
- **Background Color**: Custom background color for the section.

# Contribute and report issues

Via Github at https://github.com/MaxwellKeeble/joplin-chordpro