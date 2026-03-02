# Joplin ChordPro Plugin

This plugin for Joplin renders ChordPro files, a popular text format for writing and formatting chord charts and lyrics.

## Features

- **Code Block Rendering**: Use standard Markdown ````chordpro` code blocks to format a chord sheet.
- **Auto-Detection**: The plugin can automatically detect and render pure ChordPro notes, even without the markdown code block.
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

Or omit the code block entirely if the entire note is written in ChordPro syntax!

## Settings

Settings can be managed under **Options > ChordPro Renderer** in Joplin:

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

## Development

For information on how to build or publish the plugin, please see [GENERATOR_DOC.md](./GENERATOR_DOC.md).
