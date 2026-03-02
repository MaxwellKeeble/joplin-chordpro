// src/utils/metadataUtils.ts
import type { SongMetadata } from './types';


export interface MetadataField {
    // Accept keys that are string keys of SongMetadata or arbitrary string keys (for x_ custom metadata)
    key: Extract<keyof SongMetadata, string> | string;
    directive: string;
    aliases?: string[];
    type: 'string' | 'number' | 'array';
    onlyIfPositive?: boolean;

    // UI Configuration
    group: string;
    label?: string; // Override label if different from directive
    placeholder?: string;
    showInHeader?: boolean; // Whether to show in header summary
    multiline?: boolean;
    hideInAppHeader?: boolean; // Whether to show in metadata sidebar
    layout?: {
        width?: 'full' | 'half'; // For responsive layouts
        pairWith?: string; // Key of field to pair with (e.g., 'key' pairs with 'capo')
        order?: number; // Order within group
    };
    secondary?: boolean; // Whether to show in secondary metadata section
    bulkEditable?: boolean; // Whether this field can be bulk edited
    /**
     * Icon identifier string, e.g. 'LibraryMusic', 'Person', 'MusicNoteDim', etc.
     * Used for mapping to icon components in UI.
     */
    icon?: string;
}

export interface MetadataGroup {
    key: string;
    label: string;
    defaultExpanded: boolean;
    order: number;
    description?: string;
}

// Define metadata groups
export const METADATA_GROUPS: MetadataGroup[] = [
    { key: 'basic', label: 'Basic Information', defaultExpanded: true, order: 1, description: 'Essential song details' },
    { key: 'musical', label: 'Musical Details', defaultExpanded: true, order: 2, description: 'Key, tempo, and musical characteristics' },
    { key: 'chords', label: 'Custom Chords', defaultExpanded: false, order: 3, description: 'Custom chord definitions for this song' },
    { key: 'release', label: 'Release Information', defaultExpanded: true, order: 4, description: 'Album, year, and release details' },
    { key: 'credits', label: 'Credits and legal', defaultExpanded: false, order: 5, description: 'Composer, lyricist, and other credits' },
    { key: 'other', label: 'Other', defaultExpanded: false, order: 6, description: 'Additional metadata' }
];

// Central definition of all metadata fields
export const METADATA_FIELDS: MetadataField[] = [
    // Basic Information
    {
        key: 'title',
        directive: 'title',
        aliases: ['t'],
        type: 'string',
        group: 'basic',
        placeholder: 'Song title',
        label: 'Title',
        showInHeader: true,
        layout: { order: 1 },
        icon: 'LibraryMusic',
        hideInAppHeader: true,
        bulkEditable: false, // Title should not be bulk editable
    },
    {
        key: 'subtitle',
        directive: 'subtitle',
        aliases: ['st', 'su'],
        type: 'string',
        group: 'basic',
        label: 'Subtitle',
        placeholder: 'Subtitle or alternate title',
        showInHeader: true,
        layout: { order: 2 },
        icon: 'LibraryMusicDim',
    },
    {
        key: 'artist',
        directive: 'artist',
        type: 'string',
        group: 'basic',
        label: 'Artist',
        placeholder: 'Artist name',
        showInHeader: true,
        layout: { order: 3 },
        icon: 'Person',
        bulkEditable: true,
    },

    // Musical Details
    {
        key: 'key',
        directive: 'key',
        type: 'string',
        group: 'musical',
        label: 'Key',
        placeholder: 'Key signature (e.g., C, Am)',
        layout: { width: 'half', pairWith: 'capo', order: 1 },
        secondary: true,
        icon: 'MusicNote',
        bulkEditable: true,
    },
    {
        key: 'capo',
        directive: 'capo',
        type: 'string',
        group: 'musical',
        label: 'Capo',
        placeholder: 'Capo fret (e.g., 1, 2, 3rd fret)',
        layout: { width: 'half', pairWith: 'key', order: 2 },
        icon: 'Capo',
        bulkEditable: true,
    },
    {
        key: 'tuning',
        directive: 'tuning',
        type: 'string',
        group: 'musical',
        placeholder: 'Tuning (e.g., E A D G B E)',
        layout: { width: 'half' },
        secondary: true,
        icon: 'Tuning',
    },
    {
        key: 'tempo',
        directive: 'tempo',
        type: 'string',
        group: 'musical',
        label: 'Tempo',
        placeholder: 'Tempo (e.g., 120 BPM, Moderato)',
        layout: { width: 'half', pairWith: 'time', order: 3 },
        secondary: true,
        icon: 'AccessTime',
        bulkEditable: true,
    },
    {
        key: 'time',
        directive: 'time',
        type: 'string',
        group: 'musical',
        label: 'Time signature',
        placeholder: 'Time signature (e.g., 4/4)',
        layout: { width: 'half', pairWith: 'tempo', order: 4 },
        secondary: true,
        icon: 'AccessTimeDim',
    },
    {
        key: 'duration',
        directive: 'duration',
        type: 'string',
        group: 'musical',
        placeholder: 'Song duration (e.g., 3:45)',
        layout: { order: 5 },
        secondary: true,
        icon: 'AccessTimeFaint',
    },

    // Release Information
    {
        key: 'album',
        directive: 'album',
        type: 'string',
        group: 'release',
        label: 'Album',
        placeholder: 'Album name',
        showInHeader: true,
        layout: { order: 1 },
        icon: 'Album',
        bulkEditable: true,
    },
    {
        key: 'year',
        directive: 'year',
        type: 'string',
        group: 'release',
        label: 'Year',
        placeholder: 'Release year',
        showInHeader: true,
        layout: { width: 'half', order: 2 },
        icon: 'CalendarToday',
        bulkEditable: true,
    },
    {
        key: 'tracknumber',
        directive: 'tracknumber',
        type: 'string',
        group: 'release',
        label: 'Track number',
        placeholder: 'Track number',
        showInHeader: true,
        layout: { width: 'half', order: 3 },
        icon: 'Numbers',
    },
    {
        key: 'date',
        directive: 'date',
        type: 'string',
        group: 'release',
        label: 'Date',
        placeholder: 'Date (YYYY-MM-DD)',
        layout: { order: 4 },
        secondary: true,
        icon: 'CalendarTodayDim',
    },

    // Credits
    {
        key: 'composer',
        directive: 'composer',
        type: 'string',
        group: 'credits',
        label: 'Composer',
        placeholder: 'Composer name',
        layout: { order: 1 },
        secondary: true,
        icon: 'PersonDim',
        bulkEditable: true,
    },
    {
        key: 'lyricist',
        directive: 'lyricist',
        type: 'string',
        group: 'credits',
        label: 'Lyricist',
        placeholder: 'Lyricist name',
        layout: { order: 2 },
        secondary: true,
        icon: 'PersonFaint',
        bulkEditable: true,
    },
    {
        key: 'arranger',
        directive: 'arranger',
        type: 'string',
        group: 'credits',
        label: 'Arranger',
        placeholder: 'Arranger name',
        layout: { order: 3 },
        secondary: true,
        icon: 'PersonFainter',
    },

    // Legal
    {
        key: 'copyright',
        directive: 'copyright',
        type: 'string',
        group: 'credits',
        label: 'Copyright',
        placeholder: 'Copyright information',
        multiline: true,
        layout: { order: 1 },
        secondary: true,
        icon: 'Copyright',
        bulkEditable: true,
    },
    {
        key: 'legal',
        directive: 'legal',
        type: 'string',
        group: 'credits',
        label: 'Legal',
        placeholder: 'Legal information and notices',
        multiline: true,
        layout: { order: 2 },
        secondary: true,
        icon: 'Gavel',
    },

    // Other/Tags
    {
        key: 'tags',
        directive: 'tags',
        type: 'array',
        group: 'other',
        label: 'Tags',
        placeholder: 'Tags',
        layout: { order: 1 },
        secondary: true,
        icon: 'LocalOffer',
        hideInAppHeader: true,
        bulkEditable: true,
    },
];

// Additional directives that should be filtered out but handled specially
const SPECIAL_METADATA_DIRECTIVES = ['meta'];

// Create lookup maps for efficient processing
const directiveToField = new Map<string, MetadataField>();
const allMetadataDirectives = new Set<string>();

// Initialize lookup maps
METADATA_FIELDS.forEach(field => {
    // Map primary directive
    directiveToField.set(field.directive.toLowerCase(), field);
    allMetadataDirectives.add(field.directive.toLowerCase());

    // Map aliases
    field.aliases?.forEach(alias => {
        directiveToField.set(alias.toLowerCase(), field);
        allMetadataDirectives.add(alias.toLowerCase());
    });
});

// Add special directives to the set
SPECIAL_METADATA_DIRECTIVES.forEach(directive => {
    allMetadataDirectives.add(directive.toLowerCase());
});

// Autocomplete utility functions
export function getUniqueArtists(files: any[]): string[] {
    const artists = new Set<string>();
    files.forEach(file => {
        if (file.metadata?.artist) {
            artists.add(file.metadata.artist.trim());
        }
    });
    return Array.from(artists).sort();
}

export function getUniqueAlbums(files: any[], forArtist?: string): string[] {
    const albums = new Set<string>();
    files.forEach(file => {
        if (file.metadata?.album) {
            // If artist is specified, only include albums for that artist
            if (forArtist) {
                if (file.metadata?.artist?.toLowerCase().trim() === forArtist.toLowerCase().trim()) {
                    albums.add(file.metadata.album.trim());
                }
            } else {
                albums.add(file.metadata.album.trim());
            }
        }
    });
    return Array.from(albums).sort();
}

export function getUniqueTags(files: any[]): string[] {
    const tags = new Set<string>();
    files.forEach(file => {
        if (file.metadata?.tags && Array.isArray(file.metadata.tags)) {
            file.metadata.tags.forEach((tag: string) => {
                if (tag && typeof tag === 'string') {
                    tags.add(tag.trim());
                }
            });
        }
    });
    return Array.from(tags).sort();
}

// Get fields that are bulk editable
export function getBulkEditableFields(): MetadataField[] {
    return METADATA_FIELDS.filter(field => field.bulkEditable === true);
}

// Utility functions for UI consumption
export function getGroupedFields(): Record<string, MetadataField[]> {
    const grouped: Record<string, MetadataField[]> = {};

    METADATA_FIELDS.forEach(field => {
        const group = field.group;
        if (!grouped[group]) {
            grouped[group] = [];
        }
        grouped[group].push(field);
    });

    // Sort fields within each group by order
    Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => (a.layout?.order || 0) - (b.layout?.order || 0));
    });

    return grouped;
}

export function getGroupConfig(groupKey: string): MetadataGroup | undefined {
    return METADATA_GROUPS.find(group => group.key === groupKey);
}

export function getAllGroups(): MetadataGroup[] {
    return [...METADATA_GROUPS].sort((a, b) => a.order - b.order);
}

export function getFieldLabel(field: MetadataField): string {
    return field.label || field.directive.charAt(0).toUpperCase() + field.directive.slice(1);
}

export function getFieldPairs(): Array<[MetadataField, MetadataField]> {
    const pairs: Array<[MetadataField, MetadataField]> = [];
    const processed = new Set<string>();

    METADATA_FIELDS.forEach(field => {
        if (field.layout?.pairWith && !processed.has(field.key as string)) {
            const pairedField = METADATA_FIELDS.find(f => f.key === field.layout?.pairWith);
            if (pairedField) {
                pairs.push([field, pairedField]);
                processed.add(field.key as string);
                processed.add(pairedField.key as string);
            }
        }
    });

    return pairs;
}

export function shouldPairFields(field: MetadataField): boolean {
    return !!(field.layout?.pairWith);
}

// Rest of your existing functions remain the same...
export function handleMetadataDirective(
    directive: string,
    value: string,
    metadata: SongMetadata
): boolean {
    const directiveLower = directive.toLowerCase();
    const trimmedValue = value.trim();

    // Handle standard metadata fields
    const field = directiveToField.get(directiveLower);
    if (field && trimmedValue) {
        if (field.type === 'number') {
            const numValue = parseInt(trimmedValue);
            if (!isNaN(numValue)) {
                metadata[field.key] = numValue as any;
            }
        } else {
            // Special handling for tags
            if (field.key === 'tags' && trimmedValue) {
                metadata[field.key] = trimmedValue.split(",").map((t) => t.trim()) as any;
            } else {
                metadata[field.key] = trimmedValue as any;
            }
        }
        return true;
    }

    // Handle special metadata directives
    if (directiveLower === 'meta' && trimmedValue) {
        metadata[directive] = trimmedValue;
        return true;
    }

    // Handle custom metadata (x_ prefix)
    if (directive.startsWith('x_') && trimmedValue) {
        metadata[directive] = trimmedValue;
        return true;
    }

    return false;
}

// Convert metadata object to ChordPro directives
export function metadataToDirectives(metadata: SongMetadata, settings?: { storeArtistInSubtitle?: boolean }): string {
    const directives: string[] = [];

    METADATA_FIELDS.forEach(field => {
        const value = metadata[field.key];

        if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            // Special handling for artist/subtitle based on settings
            if (field.key === 'artist' && settings?.storeArtistInSubtitle) {
                // Store artist in subtitle field instead
                directives.push(`{subtitle: ${value}}`);
                return;
            }

            if (field.key === 'subtitle' && settings?.storeArtistInSubtitle && metadata.artist) {
                // Skip subtitle if we're storing artist there
                return;
            }

            // Handle special cases
            if (field.type === 'number') {
                const numValue = typeof value === 'number' ? value : parseInt(value as string);
                if (!isNaN(numValue) && (!field.onlyIfPositive || numValue > 0)) {
                    directives.push(`{${field.directive}: ${numValue}}`);
                }
            } else if (field.key === 'tags' && Array.isArray(value) && value.length > 0) {
                // Handle tags array - only if array has content
                directives.push(`{${field.directive}: ${value.join(', ')}}`);
            } else if (field.key === 'customChords') {
                // Custom chords are handled separately below, skip here
                return;
            } else {
                directives.push(`{${field.directive}: ${value}}`);
            }
        }
    });

    // Handle custom metadata
    Object.keys(metadata).forEach(key => {
        if ((key.startsWith('x_') || key === 'meta') && metadata[key]) {
            directives.push(`{${key}: ${metadata[key]}}`);
        }
    });

    // Handle custom chord definitions
    if (metadata.customChords && Array.isArray(metadata.customChords) && metadata.customChords.length > 0) {
        const chordDirectives = metadata.customChords.map(chord => {
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
        
        if (chordDirectives) {
            directives.push(chordDirectives);
        }
    }

    return directives.length > 0 ? directives.join('\n') + '\n' : '';
}

// Remove metadata directives from content
export function removeMetadataDirectives(content: string): string {
    if (!content) return content;
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
        const directiveMatch = line.match(/^\s*\{([^:}]+)(?::([^}]*))?\}\s*$/);
        if (!directiveMatch) return true;

        const [, directive] = directiveMatch;
        const directiveLower = directive.toLowerCase();

        // Filter out known metadata directives, custom metadata (x_ prefix), and define directives
        return !allMetadataDirectives.has(directiveLower) &&
            !directive.startsWith('x_') &&
            directiveLower !== 'define';
    });

    // Remove leading empty lines after filtering out metadata
    let startIndex = 0;
    while (startIndex < filteredLines.length && filteredLines[startIndex].trim() === '') {
        startIndex++;
    }

    return filteredLines.slice(startIndex).join('\n');
}

// Combine metadata directives with content
export function combineMetadataWithContent(metadata: SongMetadata, content: string, settings?: { storeArtistInSubtitle?: boolean }): string {
    const metadataDirectives = metadataToDirectives(metadata, settings);
    const contentWithoutMetadata = removeMetadataDirectives(content);
    
    // Add an extra line break between metadata and content if metadata exists
    if (metadataDirectives && contentWithoutMetadata) {
        return metadataDirectives + '\n' + contentWithoutMetadata;
    }
    
    return metadataDirectives + contentWithoutMetadata;
}

// Extract metadata directives from content
export function extractMetadataFromContent(content: string): SongMetadata {
    const metadata: SongMetadata = {};
    const lines = content.split('\n');

    for (const line of lines) {
        // Parse directives - handle multiple directives on one line
        const parseDirectivesFromLine = (line: string): Array<{directive: string, value: string}> => {
            const directives: Array<{directive: string, value: string}> = [];
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
                        const directive = fullContent.substring(0, colonIndex).trim();
                        const value = fullContent.substring(colonIndex + 1).trim();
                        directives.push({ directive, value });
                    } else {
                        // Directive without value (but not define)
                        directives.push({ directive: fullContent, value: '' });
                    }
                }
            }
            
            // If no complete matches found, try incomplete directive (missing closing brace)
            if (!hasCompleteMatches) {
                const incompleteMatch = line.match(/^\s*\{([^:}]+)(?::(.*))?$/);
                if (incompleteMatch) {
                    const directive = incompleteMatch[1];
                    const value = incompleteMatch[2] || "";
                    directives.push({ directive, value: value.trim() });
                }
            }
            
            return directives;
        };

        const foundDirectives = parseDirectivesFromLine(line);
        for (const { directive, value } of foundDirectives) {
            handleMetadataDirective(directive, value, metadata);
        }
    }

    return metadata;
}

// Utility function to get all recognized metadata directive names
export function getAllMetadataDirectives(): string[] {
    return Array.from(allMetadataDirectives);
}

// Utility function to check if a directive is a metadata directive
export function isMetadataDirective(directive: string): boolean {
    return allMetadataDirectives.has(directive.toLowerCase()) || directive.startsWith('x_');
}

export function getEffectiveArtist(metadata: SongMetadata, settings?: { treatSubtitleAsArtist?: boolean }): string {
    if (!metadata) return "";

    // If we have an artist field, use it
    if (metadata.artist) {
        return metadata.artist;
    }

    // If treatSubtitleAsArtist is enabled and we have a subtitle but no artist
    if (settings?.treatSubtitleAsArtist && metadata.subtitle && !metadata.artist) {
        return metadata.subtitle;
    }

    return "";
}

export function getEffectiveSubtitle(metadata: SongMetadata, settings?: { treatSubtitleAsArtist?: boolean }): string {
    if (!metadata) return "";

    // If we're treating subtitle as artist and there's no separate artist field,
    // don't show subtitle separately to avoid duplication
    if (settings?.treatSubtitleAsArtist && metadata.subtitle && !metadata.artist) {
        return "";
    }

    return metadata.subtitle || "";
}

// Convert CustomChordDefinition array to user-editable string format
export function customChordsToString(customChords?: import('./types').CustomChordDefinition[]): string {
    if (!customChords || customChords.length === 0) return '';
    
    return customChords.map(chord => {
        let result = `${chord.name}: ${chord.frets.join('')}`;
        if (chord.baseFret && chord.baseFret > 1) {
            result += ` (base-fret ${chord.baseFret})`;
        }
        if (chord.fingers && chord.fingers.length > 0) {
            result += ` [${chord.fingers.join('')}]`;
        }
        return result;
    }).join('\n');
}

// Convert user-editable string format to CustomChordDefinition array
export function stringToCustomChords(input: string): import('./types').CustomChordDefinition[] {
    if (!input || !input.trim()) return [];
    
    const lines = input.split('\n').filter(line => line.trim());
    const chords: import('./types').CustomChordDefinition[] = [];
    
    for (const line of lines) {
        // Format: "ChordName: 466544" or "ChordName: 466544 (base-fret 3) [1234xx]"
        const match = line.match(/^([A-Za-z0-9#+\-/]+):\s*([x0-9\-]+)(?:\s*\(base-fret\s+(\d+)\))?(?:\s*\[([0-9x\-]*)\])?/);
        if (match) {
            const [, name, fretsStr, baseFretStr, fingersStr] = match;
            const frets: (number | 'x' | '-')[] = fretsStr.split('').map(f => {
                if (f === 'x' || f === 'X' || f === '-') return f.toLowerCase() as 'x' | '-';
                const num = parseInt(f);
                return isNaN(num) ? 'x' : num;
            });
            
            const chord: import('./types').CustomChordDefinition = {
                name,
                frets,
                baseFret: baseFretStr ? parseInt(baseFretStr) : undefined,
                fingers: fingersStr ? fingersStr.split('').map(f => parseInt(f)).filter(n => !isNaN(n)) : undefined
            };
            
            chords.push(chord);
        }
    }
    
    return chords;
}
