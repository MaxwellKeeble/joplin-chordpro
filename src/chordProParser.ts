// src/utils/chordProParser.ts

import { SongMetadata, CustomChordDefinition } from "./types";
import { handleMetadataDirective, getEffectiveArtist } from "./metadataUtils";

export interface ParsedChordPro {
  metadata: SongMetadata;
  sections: Section[];
  chords: string[];
}

export interface Section {
  type: "verse" | "chorus" | "bridge" | "tab" | "grid" | "text" | "comment";
  label?: string;
  lines: Line[];
}

export interface Line {
  text: string;
  chords: ChordPosition[];
  type?: "lyrics" | "comment" | "tab";
}

export interface ChordPosition {
  chord: string;
  position: number;
}

export function parseChordPro(
  content: string,
  transposeAmount: number = 0
): ParsedChordPro {
  try {
    if (!content) return { metadata: {}, sections: [], chords: [] };

    // Log first few lines to check for {c:} presence
    const firstLines = content.split('\n').slice(0, 10);
    const hasCDirective = firstLines.some(line => line.includes('{c:'));
    if (hasCDirective) {
      console.log('Found {c:} directive in input content');
    }

    // Convert legacy chord formats before parsing
    const normalizedContent = convertLegacyChordsToDefine(content);


    const lines = normalizedContent.split("\n");
    const metadata: SongMetadata = {};
    const sections: Section[] = [];
    const chordSet = new Set<string>();

    let currentSection: Section | null = null;

    for (const line of lines) {

      // Skip empty lines
      if (!line.trim()) {
        if (currentSection) {
          currentSection.lines.push({ text: "", chords: [] });
        }
        continue;
      }

      // Parse directives - handle multiple directives on one line and incomplete directives
      const parseDirectivesFromLine = (line: string): Array<{ directive: string, value: string }> => {
        const directives: Array<{ directive: string, value: string }> = [];
        let hasCompleteMatches = false;
        // Handle all directive formats in a single pass
        const allDirectivesRegex = /\{([^}]+)\}/g;
        let match;
        while ((match = allDirectivesRegex.exec(line)) !== null) {
          const fullContent = match[1].trim();
          hasCompleteMatches = true;


          // Check if it's a define directive (spaces instead of colon)
          if (fullContent.startsWith('define ')) {
            directives.push({ directive: 'define', value: fullContent.substring(7).trim() });
          } else {
            // Regular directive with colon
            const colonIndex = fullContent.indexOf(':');
            if (colonIndex >= 0) {
              let directive = fullContent.substring(0, colonIndex).trim();
              const value = fullContent.substring(colonIndex + 1).trim();
              // Treat {c: } as {comment: }
              if (directive === 'c') directive = 'comment';
              directives.push({ directive, value });
            } else {
              // Directive without value (but not define)
              let directive = fullContent;
              if (directive === 'c') directive = 'comment';
              directives.push({ directive, value: '' });
            }
          }
        }
        // If no complete matches found, try incomplete directive (missing closing brace)
        if (!hasCompleteMatches) {
          const incompleteMatch = line.match(/^\s*\{([^:}]+)(?::(.*))?$/);
          if (incompleteMatch) {
            let directive = incompleteMatch[1];
            const value = incompleteMatch[2] || "";
            if (directive === 'c') directive = 'comment';
            directives.push({ directive, value: value.trim() });
          }
        }
        return directives;
      };

      const foundDirectives = parseDirectivesFromLine(line);
      if (foundDirectives.length > 0) {
        let processedAnyDirective = false;


        for (const { directive, value } of foundDirectives) {

          // Handle comment directive: check if it's a chorus reference
          if (directive === "comment") {
            // Check if the comment value is "Chorus" (case insensitive) and if there are existing chorus sections
            const isChorusComment = value.trim().toLowerCase() === 'chorus';
            const hasExistingChorus = sections.some(section => section.type === 'chorus');

            if (isChorusComment && hasExistingChorus) {
              // Convert to a chorus section instead of a comment
              currentSection = {
                type: "chorus",
                label: value,
                lines: [],
              };
              sections.push(currentSection);
            } else {
              // Always treat as a comment line - this ensures consistent rendering in preview
              if (!currentSection || currentSection.type !== "comment") {
                currentSection = { type: "comment", lines: [] };
                sections.push(currentSection);
              }
              currentSection.lines.push({
                text: value,
                chords: [],
                type: "comment",
              });
              // After a comment, close the comment section so the next line starts a new section if needed
              currentSection = null;
            }
            processedAnyDirective = true;
            continue;
          }

          // Handle metadata directives using centralized function
          if (handleMetadataDirective(directive, value, metadata)) {
            processedAnyDirective = true;
            continue;
          }

          // Handle custom chord definition directive
          if (directive === "define") {
            const chordDef = parseDefineDirective(value);
            if (chordDef && chordDef.name && Array.isArray(chordDef.frets) && chordDef.frets.length > 0) {
              if (!metadata.customChords) {
                metadata.customChords = [];
              }
              metadata.customChords.push(chordDef);
            } else {
              console.warn('Skipped invalid chord definition:', value, chordDef);
            }
            processedAnyDirective = true;
            continue;
          }


          // Handle section start directives
          if (directive.startsWith("start_of_") || directive.startsWith("so")) {
            let sectionTypeStart = directive.replace(/^(start_of_|so)/, "");

            let sectionType: Section["type"];

            switch (sectionTypeStart) {
              case "c":
                sectionType = "chorus";
                break;
              case "v":
                sectionType = "verse";
                break;
              case "t":
                sectionType = "tab";
                break;
              default:
                sectionType = sectionTypeStart.replace(/_/g, "") as Section["type"];
            }

            currentSection = {
              type: sectionType,
              label: value,
              lines: [],
            };

            sections.push(currentSection);
            processedAnyDirective = true;
            continue;
          }

          // Handle section end directives
          if (directive.startsWith("end_of_") || directive.startsWith("eo")) {
            currentSection = null;
            processedAnyDirective = true;
            continue;
          }

          // Handle standalone section directives (chorus, verse, bridge)
          if (["chorus", "verse", "bridge"].includes(directive.toLowerCase())) {
            const sectionType = directive.toLowerCase() as Section["type"];
            currentSection = {
              type: sectionType,
              label: value || sectionType,
              lines: [],
            };
            sections.push(currentSection);
            processedAnyDirective = true;
            continue;
          }

          // Handle other special directives
          if (directive === "grid") {
            currentSection = { type: "grid", lines: [] };
            sections.push(currentSection);
            processedAnyDirective = true;
            continue;
          }

          if (directive === "no_grid") {
            currentSection = null;
            processedAnyDirective = true;
            continue;
          }
        }

        // If we processed any directives, skip parsing this line as chords/lyrics
        if (processedAnyDirective) {
          continue;
        }
      }

      // Parse lines with chords
      const parsedLine = parseLine(line, transposeAmount);
      if (parsedLine) {
        parsedLine.chords.forEach((cp) => {
          if (!cp.chord.startsWith("*")) {
            chordSet.add(cp.chord);
          }
        });

        // If the previous section was a comment, always start a new text section
        if (!currentSection || currentSection.type === "comment") {
          currentSection = { type: "text", lines: [] };
          sections.push(currentSection);
        }
        currentSection.lines.push(parsedLine);
      }
    }

    const result = {
      metadata,
      sections,
      chords: Array.from(chordSet).sort(),
    };

    // Log section ordering for debugging comment positioning
    // const sectionSummary = sections.map((s, i) => `${i}:${s.type}(${s.lines.length})`).join(' -> ');

    return result;
  } catch (error) {
    console.error('Error parsing ChordPro content:', error);
    console.error('Content that caused error:', content);
    // Return a safe fallback result
    return {
      metadata: {},
      sections: [{ type: 'verse', lines: [{ text: 'Error parsing content', chords: [] }] }],
      chords: []
    };
  }
}

function parseLine(line: string, transposeAmount: number): Line | null {
  const chords: ChordPosition[] = [];
  let text = "";
  let lastPos = 0;

  // Regular expression to match chords in brackets
  const chordRegex = /\[([^\]]+)\]/g;
  let match;

  while ((match = chordRegex.exec(line)) !== null) {
    const [fullMatch, chord] = match;
    const position = match.index;

    // Add text before the chord
    text += line.substring(lastPos, position);

    // Add the chord at the current text position
    chords.push({
      chord:
        transposeAmount !== 0 && !chord.startsWith("*")
          ? transposeChord(chord, transposeAmount)
          : chord,
      position: text.length,
    });

    lastPos = position + fullMatch.length;
  }

  // Add remaining text
  text += line.substring(lastPos);

  return { text, chords };
}

export function transposeChord(chord: string, semitones: number): string {
  // Handle annotations (starting with *)
  if (chord.startsWith("*")) return chord;

  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const flats = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];

  // Helper function to transpose a single note
  const transposeNote = (note: string): string => {
    let noteIndex = notes.indexOf(note);
    if (noteIndex === -1) {
      noteIndex = flats.indexOf(note);
      if (noteIndex === -1) return note;
    }

    // Transpose
    noteIndex = (noteIndex + semitones + 12) % 12;
    if (noteIndex < 0) noteIndex += 12;

    // Return transposed note
    const useFlats =
      note.includes("b") || ["F", "Bb", "Eb", "Ab", "Db", "Gb"].includes(note);
    return useFlats ? flats[noteIndex] : notes[noteIndex];
  };

  // Check for slash chord (compound chord) like Gm/F
  const slashIndex = chord.indexOf('/');
  if (slashIndex !== -1) {
    const mainChord = chord.substring(0, slashIndex);
    const bassNote = chord.substring(slashIndex + 1);

    // Parse and transpose the main chord part
    const mainChordRegex = /^([A-G][#b]?)(.*)$/;
    const mainMatch = mainChord.match(mainChordRegex);

    // Parse and transpose the bass note
    const bassNoteRegex = /^([A-G][#b]?)(.*)$/;
    const bassMatch = bassNote.match(bassNoteRegex);

    if (!mainMatch || !bassMatch) return chord;

    const [, mainRoot, mainSuffix] = mainMatch;
    const [, bassRoot, bassSuffix] = bassMatch;

    const transposedMainRoot = transposeNote(mainRoot);
    const transposedBassRoot = transposeNote(bassRoot);

    return `${transposedMainRoot}${mainSuffix}/${transposedBassRoot}${bassSuffix}`;
  }

  // Parse regular chord (non-slash)
  const chordRegex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(chordRegex);

  if (!match) return chord;

  const [, root, suffix] = match;
  const transposedRoot = transposeNote(root);

  return transposedRoot + suffix;
}

export function convertChordProToHTML(
  parsed: ParsedChordPro,
  settings?: { treatSubtitleAsArtist?: boolean; useInlineChords?: boolean; useNonMonospaceFont?: boolean; showSectionHeadings?: boolean; showHeader?: boolean; addSectionToggles?: boolean; useGridLayout?: boolean; gridColumns?: number }
): string {
  // Determine if we'll actually use grid layout (same logic as below)
  const willUseGridLayout = settings?.useGridLayout &&
    settings?.gridColumns &&
    settings.gridColumns > 1 &&
    parsed.sections.length >= settings.gridColumns * 2;

  const songClasses = ['chordpro-song'];
  if (settings?.useNonMonospaceFont) {
    songClasses.push('non-monospace');
  }
  if (settings?.useInlineChords) {
    songClasses.push('inline-chords');
  }
  // Only add grid-layout class if we're actually going to use it
  if (willUseGridLayout) {
    songClasses.push('grid-layout');
  }

  let html = `<div class="${songClasses.join(' ')}">`;

  // Add metadata header if present and enabled (default true, false for normal preview)
  const effectiveArtist = getEffectiveArtist(parsed.metadata, settings);
  if (
    (settings?.showHeader !== false) &&
    (parsed.metadata.title ||
      parsed.metadata.subtitle ||
      effectiveArtist)
  ) {
    html += '<div class="song-header">';
    if (parsed.metadata.title) {
      html += `<h1 class="song-title">${escapeHtml(
        parsed.metadata.title
      )}</h1>`;
    }
    if (parsed.metadata.subtitle && (!settings?.treatSubtitleAsArtist || parsed.metadata.subtitle !== effectiveArtist)) {
      html += `<h2 class="song-subtitle">${escapeHtml(
        parsed.metadata.subtitle
      )}</h2>`;
    }
    if (effectiveArtist) {
      html += `<div class="song-artist">${escapeHtml(
        effectiveArtist
      )}</div>`;
    }
    if (parsed.metadata.key || parsed.metadata.capo || parsed.metadata.tempo) {
      html += '<div class="song-info">';
      if (parsed.metadata.key) {
        html += `<span class="info-item">Key: ${escapeHtml(
          parsed.metadata.key
        )}</span>`;
      }
      if (parsed.metadata.capo && parsed.metadata.capo.trim() !== '') {
        html += `<span class="info-item">Capo: ${escapeHtml(parsed.metadata.capo)}</span>`;
      }
      if (parsed.metadata.tempo) {
        html += `<span class="info-item">Tempo: ${escapeHtml(
          parsed.metadata.tempo
        )}</span>`;
      }
      html += "</div>";
    }
    html += "</div>";
  }

  // Add sections - either as grid items or regular flow
  // Only use grid layout if we have enough sections to meaningfully distribute
  // Grid layout works best when you have many small sections (like verse/chorus structure)
  // Use CSS columns for songs with few large sections or mostly text
  const useGridLayoutForContent = settings?.useGridLayout &&
    settings?.gridColumns &&
    settings.gridColumns > 1 &&
    parsed.sections.length >= settings.gridColumns * 2; // Need at least 2x sections as columns

  if (useGridLayoutForContent) {
    // Grid layout: distribute content across columns with smart balancing
    const columns = settings.gridColumns!; // Guaranteed to be defined by useGridLayoutForContent check

    // Count total lines across all sections to better distribute content
    let totalLines = 0;
    const sectionLineCounts: number[] = [];

    for (const section of parsed.sections) {
      let sectionLineCount = 0;
      for (const line of section.lines) {
        // Count both chord lines and lyric lines, plus empty lines
        if (line.chords && line.chords.length > 0) sectionLineCount++;
        if (line.text && line.text.trim()) sectionLineCount++;
        if (!line.text?.trim() && (!line.chords || line.chords.length === 0)) sectionLineCount++; // empty lines
      }
      sectionLineCounts.push(sectionLineCount);
      totalLines += sectionLineCount;
    }

    const targetLinesPerColumn = Math.ceil(totalLines / columns);

    html += `<div class="grid-container" style="grid-template-columns: repeat(${columns}, 1fr); gap: 2rem;">`;

    let currentColumn = 0;
    let currentColumnLines = 0;

    // Start first column
    html += `<div class="grid-column">`;

    for (let sectionIndex = 0; sectionIndex < parsed.sections.length; sectionIndex++) {
      const section = parsed.sections[sectionIndex];
      const sectionLines = sectionLineCounts[sectionIndex];

      // Check if we should start a new column (but not if we're on the last column)
      if (currentColumn < columns - 1 &&
        currentColumnLines > 0 &&
        currentColumnLines + sectionLines > targetLinesPerColumn) {

        // Close current column and start new one
        html += `</div><div class="grid-column">`;
        currentColumn++;
        currentColumnLines = 0;
      }

      html += renderSection(section, sectionIndex, parsed.sections, settings);
      currentColumnLines += sectionLines;
    }

    // Close the last column
    html += `</div>`;

    // Add empty columns if needed
    while (currentColumn < columns - 1) {
      html += `<div class="grid-column"></div>`;
      currentColumn++;
    }

    html += `</div>`;
  } else {
    // Regular flow layout
    for (const [sectionIndex, section] of parsed.sections.entries()) {
      html += renderSection(section, sectionIndex, parsed.sections, settings);
    }
  }

  html += "</div>";
  return html;
}

function renderSection(section: any, sectionIndex: number, allSections: any[], settings: any): string {
  let html = '';

  // Treat 'comment' section type as comments
  const isCommentSection = section.type === 'comment';

  // Check if this is an empty or text-only chorus block
  const isEmptyChorus = section.type === 'chorus' && (
    section.lines.length === 0 ||
    (section.lines.length === 1 &&
      section.lines[0].chords.length === 0 &&
      (section.lines[0].text.trim() === '' ||
        section.lines[0].text.trim().toLowerCase() === 'chorus'))
  );

  // Find the previous chorus content for empty chorus blocks
  let precedingChorusIndex = -1;
  if (isEmptyChorus) {
    for (let i = sectionIndex - 1; i >= 0; i--) {
      if (allSections[i].type === 'chorus' &&
        allSections[i].lines.length > 0 &&
        allSections[i].lines.some((line: any) => line.chords.length > 0 ||
          (line.text.trim() !== '' && line.text.trim().toLowerCase() !== 'chorus'))) {
        precedingChorusIndex = i;
        break;
      }
    }
  }

  html += `<div class="section section-${section.type}" data-section-index="${sectionIndex}" data-section-type="${section.type}"${isEmptyChorus ? ' data-empty-chorus="true"' : ''}${precedingChorusIndex >= 0 ? ` data-preceding-chorus="${precedingChorusIndex}"` : ''}>`;

  // Determine if section should be collapsible
  const isCollapsibleType = ["chorus", "verse", "bridge", "tab"].includes(section.type) || !!section.label;

  // Add section label (only if showSectionHeadings is enabled, default true for backward compatibility)
  if ((settings?.showSectionHeadings !== false) && (section.label || section.type == "chorus" || section.type == "verse" || section.type == "bridge")) {
    const sectionTitle =
      section.label ||
      section.type.charAt(0).toUpperCase() + section.type.slice(1);
    // Place toggle button next to the title inside the label when applicable
    if (settings?.addSectionToggles !== false && isCollapsibleType) {
      // For empty chorus blocks, start collapsed and show special behavior
      const initialExpanded = isEmptyChorus ? "false" : "true";
      html += `<div class="section-label"><span class="section-title">${escapeHtml(sectionTitle)}</span><button class="section-toggle" type="button" aria-label="Collapse section" aria-expanded="${initialExpanded}" title="Collapse/Expand" data-toggle="collapse"><svg class="section-toggle-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg></button></div>`;
    } else {
      html += `<div class="section-label"><span class="section-title">${escapeHtml(sectionTitle)}</span></div>`;
    }
  } else if (settings?.addSectionToggles !== false && isCollapsibleType) {
    // Fallback: if no label is shown, still render a toggle button at the top of the section
    const initialExpanded = isEmptyChorus ? "false" : "true";
    html += `<button class="section-toggle" type="button" aria-label="Collapse section" aria-expanded="${initialExpanded}" title="Collapse/Expand" data-toggle="collapse"><svg class="section-toggle-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg></button>`;
  }

  // Add lines
  if (isEmptyChorus) {
    // For empty chorus blocks, don't render the text "Chorus" - just the section header
    const hasText = section.lines.length > 0 && section.lines[0].text.trim() !== '' && section.lines[0].text.trim().toLowerCase() !== 'chorus';
    if (!hasText) {
      // Add placeholder content that will be replaced when expanded
      html += `<div class="empty-chorus-placeholder" style="display: none;"></div>`;
    } else {
      // If there's meaningful text other than "Chorus", show it
      for (const line of section.lines) {
        if (line.text.trim() !== '' && line.text.trim().toLowerCase() !== 'chorus') {
          html += `<div class="lyrics-line">${escapeHtml(line.text)}</div>`;
        }
      }
    }
  } else {
    // Normal section rendering
    for (const line of section.lines) {
      if (section.type == 'tab') {
        line.type = 'tab';
      }
      // Render comment lines for both comment and c section types
      if (isCommentSection || line.type === "comment") {
        html += `<div class="comment-line">${escapeHtml(line.text)}</div>`;
      } else if (line.chords.length === 0) {
        // Line without chords
        const trimmed = line.text.trim();
        // Render horizontal rule for lines of only dashes/hyphens (3 or more)
        if (/^[-–—]{3,}$/.test(trimmed)) {
          html += '<hr class="chordpro-hr" />';
        } else if (trimmed) {
          // Detect if the line is just a URL
          const urlRegex = /^(https?:\/\/[^\s]+)$/i;
          const match = trimmed.match(urlRegex);
          if (match) {
            // Render as a button (styled anchor) for preview, hidden in print
            html += `<div class="lyrics-line preview-url-button"><a href="${escapeHtml(trimmed)}" target="_blank" rel="noopener noreferrer" class="MuiButton-root MuiButton-contained MuiButton-sizeSmall" style="text-transform:none;min-width:0;" tabindex="0">Open Link</a></div>`;
          } else if (line.type == 'tab') {
            html += `<div class="tabs-line">${escapeHtml(line.text)}</div>`;
          } else {
            html += `<div class="lyrics-line">${escapeHtml(line.text)}</div>`;
          }
        } else {
          html += '<div class="empty-line">&nbsp;</div>';
        }
      } else {
        // Line with chords
        if (settings?.useInlineChords) {
          // Inline chord mode - combine chords and lyrics in one line
          html += '<div class="inline-chord-line">';

          let currentPos = 0;
          let result = '';

          // Sort chords by position to process them in order
          const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);

          for (const chordPos of sortedChords) {
            // Add text before this chord
            if (chordPos.position > currentPos) {
              result += escapeHtml(line.text.substring(currentPos, chordPos.position));
            }

            // Add the chord as superscript
            const chordClass = chordPos.chord.startsWith("*") ? "annotation-inline" : "chord-inline";
            const chordText = chordPos.chord.startsWith("*")
              ? chordPos.chord.substring(1)
              : chordPos.chord;
            result += `<sup class="${chordClass}">${escapeHtml(chordText)}</sup>`;

            currentPos = chordPos.position;
          }

          // Add remaining text after all chords
          if (currentPos < line.text.length) {
            result += escapeHtml(line.text.substring(currentPos));
          }

          html += result || '&nbsp;'; // Ensure we have content even if empty
          html += '</div>';
        } else {
          // Traditional chord display mode
          html += '<div class="chord-line-container">';

          // Build chord line
          html += '<div class="chord-line">';
          let lastPos = 0;
          for (const [index, chordPos] of line.chords.entries()) {
            let spaces = chordPos.position - lastPos;

            // If this is the very first chord in the line and it's at position 0,
            // don't insert a leading spacer — the chord should sit immediately
            // above the lyric start. For other cases, ensure at least one space
            // between adjacent chords.
            if (index === 0 && chordPos.position === 0) {
              spaces = 0;
            } else if (spaces <= 0) {
              spaces = 1;
            }

            if (spaces > 0) {
              html +=
                '<span class="chord-spacer">' +
                "&nbsp;".repeat(spaces) +
                "</span>";
            }

            const chordClass = chordPos.chord.startsWith("*")
              ? "annotation"
              : "chord";
            const chordText = chordPos.chord.startsWith("*")
              ? chordPos.chord.substring(1)
              : chordPos.chord;
            html += `<span class="${chordClass}">${escapeHtml(chordText)}</span>`;

            // Update lastPos to the position after this chord. Use the chord
            // length to account for multi-character chord names.
            lastPos = chordPos.position + chordText.length;
          }
          html += "</div>";

          // Add lyrics line
          if (line.text.trim()) {
            html += `<div class="lyrics-line">${escapeHtml(line.text)}</div>`;
          }

          html += "</div>";
        }
      }
    }
  }

  html += "</div>";

  return html;
}



function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Parse {define} directive according to ChordPro standards
function parseDefineDirective(value: string): CustomChordDefinition | null {
  if (!value.trim()) return null;

  // ChordPro define format: {define chordname base-fret fret fret fret fret fret fret [fingers]}
  // Example: {define Fadd9 base-fret 1 frets x x 3 2 1 3}
  // Simplified format: {define A9 1 3 2 4 2 - -}

  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) {
    console.warn(`Invalid define directive: "${value}" - not enough parts`);
    return null;
  }

  const chordName = parts[0];
  let baseFret = 1;
  let frets: (number | 'x' | '-')[] = [];
  let fingers: number[] = [];

  let i = 1;

  // Check if base-fret is specified
  if (parts[i] === 'base-fret' && i + 1 < parts.length) {
    baseFret = parseInt(parts[i + 1]) || 1;
    i += 2;
  } else if (parts[i] === 'frets' && i + 1 < parts.length) {
    // Skip 'frets' keyword if present
    i += 1;
  } else if (!isNaN(parseInt(parts[i]))) {
    // If first value is a number, treat it as base fret (simplified format)
    baseFret = parseInt(parts[i]) || 1;
    i += 1;
  }

  // Parse fret positions
  while (i < parts.length && parts[i] !== 'fingers') {
    const fret = parts[i];
    if (fret === 'x' || fret === 'X' || fret === '-') {
      frets.push(fret.toLowerCase() as 'x' | '-');
    } else {
      const fretNum = parseInt(fret);
      if (!isNaN(fretNum)) {
        frets.push(fretNum);
      }
    }
    i++;
  }

  // Parse fingers if present
  if (parts[i] === 'fingers') {
    i++;
    while (i < parts.length) {
      const finger = parseInt(parts[i]);
      if (!isNaN(finger)) {
        fingers.push(finger);
      }
      i++;
    }
  }

  // Ensure we have fret data
  if (frets.length === 0) {
    console.warn(`No fret data found in define directive: "${value}"`);
    return null;
  }

  return {
    name: chordName,
    baseFret: baseFret > 1 ? baseFret : undefined,
    frets: frets,
    fingers: fingers.length > 0 ? fingers : undefined
  };
}

// Convert legacy chord formats to standard {define} format
export function convertLegacyChordsToDefine(content: string): string {
  try {
    // Quick check - if no legacy patterns are found, return original content
    if (!content.includes(':') && !content.includes('{c:') && !content.includes('{define:')) {
      return content;
    }

    let updatedContent = content;

    // Pattern 1: "Gsmaj: 466544" format (handles spaces after colon and multiple spaces)
    const colonPattern = /^([A-Za-z0-9#+\-/]+):\s*([x0-9\-\s]+)$/gm;
    updatedContent = updatedContent.replace(colonPattern, (_, chordName, frets) => {
      // Clean up the frets string and handle both spaced and unspaced formats
      const cleanFrets = frets.replace(/\s+/g, '').split('').join(' ');
      return `{define ${chordName} frets ${cleanFrets}}`;
    });

    // Pattern 2: Comment with chord definitions like {c:Am+ = xx2211; Am6 = xx2212; ...}
    // Only match {c:} directives that contain '=' (chord definitions)
    const commentChordPattern = /\{c:([^}]*=[^}]+)\}/g;
    updatedContent = updatedContent.replace(commentChordPattern, (_, chordDefs) => {
      const definitions = chordDefs.split(';').map((def: string) => {
        const [name, frets] = def.split('=').map((s: string) => s.trim());
        if (name && frets) {
          // Clean up frets and remove trailing punctuation
          const cleanedFrets = frets.replace(/[.;,]+$/, '').trim();
          if (cleanedFrets.match(/^[x0-9\-]+$/)) { // Validate frets format
            // Handle both spaced and unspaced fret notations
            const cleanFrets = cleanedFrets.replace(/\s+/g, '').split('').join(' ');
            return `{define ${name} frets ${cleanFrets}}`;
          }
        }
        return '';
      }).filter(Boolean);

      return definitions.join('\n');
    });

    // Pattern 3: Old define format with colon - {define:Bb7 1 6 6 7 6 8 6}
    const oldDefinePattern = /\{define:([A-Za-z0-9#+\-/]+)\s+([0-9\s\-x]+)\}/g;
    updatedContent = updatedContent.replace(oldDefinePattern, (_, chordName, fretString) => {
      const frets = fretString.trim().split(/\s+/);
      const baseFret = parseInt(frets[0]);

      if (!isNaN(baseFret) && baseFret > 0) {
        const fretPositions = frets.slice(1);
        return `{define ${chordName} base-fret ${baseFret} frets ${fretPositions.join(' ')}}`;
      } else {
        return `{define ${chordName} ${frets.join(' ')}}`;
      }
    });

    // Pattern 4: Only process malformed {define} directives that are missing proper format
    // This pattern is more conservative to avoid infinite loops
    const malformedDefinePattern = /\{define\s+([A-Za-z0-9#+\-/]+)\s+([0-9x\-\s]+)\s*\}/g;
    updatedContent = updatedContent.replace(malformedDefinePattern, (match, chordName, frets) => {
      // Only convert if it doesn't already have 'frets' keyword
      if (!match.includes('frets')) {
        const cleanFrets = frets.trim().split(/\s+/).join(' ');
        return `{define ${chordName} frets ${cleanFrets}}`;
      }
      return match; // Return unchanged if already properly formatted
    });

    return updatedContent;
  } catch (error) {
    console.error('Error converting legacy chords:', error);
    console.error('Content that caused error:', content);
    // Return original content as fallback
    return content;
  }
}

// Function to convert custom chord definitions back to define directives for export
export function customChordsToDefineDirectives(customChords: CustomChordDefinition[]): string {
  if (!customChords || customChords.length === 0) return '';

  return customChords.map(chord => {
    let directive = `{define ${chord.name}`;

    if (chord.baseFret && chord.baseFret > 1) {
      directive += ` base-fret ${chord.baseFret}`;
    }

    directive += ` frets ${chord.frets.join(' ')}`;

    if (chord.fingers && chord.fingers.length > 0) {
      directive += ` fingers ${chord.fingers.join(' ')}`;
    }

    directive += '}';
    return directive;
  }).join('\n');
}
