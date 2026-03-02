// src/types/index.ts

export type SourceType = "local" | "google" | "dropbox" | "tauri";

export interface ChordProFile {
    id: string;
    name: string;
    path: string;
    content: string;
    metadata: SongMetadata;
    source: SourceType;
    lastModified: string;
    size: number;
    deletedAt?: string; // ISO string timestamp when moved to bin
    transposeAmount?: number; // Transposition setting for this song
    syncedContent?: string; // Content as it was last synced from storage
    syncedLastModified?: string; // LastModified as it was last synced from storage
    hasConflict?: boolean; // True if there's a conflict between local and synced version
    importedAt?: string; // ISO string timestamp when file was imported
}

export interface CustomChordDefinition {
    name: string;
    baseFret?: number;
    frets: (number | 'x' | '-')[];
    fingers?: number[];
    barres?: { fromString: number; toString: number; fret: number }[];
}

export interface SongMetadata {
    title?: string;
    subtitle?: string;
    artist?: string;
    composer?: string;
    lyricist?: string;
    arranger?: string;
    album?: string;
    year?: string;
    tracknumber?: string | number;
    date?: string;
    key?: string;
    time?: string;
    tempo?: string;
    duration?: string;
    capo?: string;
    tags?: string[];
    copyright?: string;
    legal?: string;
    customChords?: CustomChordDefinition[];
    [key: string]: any;
}

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    songs: string[]; // Song IDs
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface EditorSettings {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    theme: 'light' | 'dark';
    showLineNumbers: boolean;
    autoComplete: boolean;
    syntaxHighlighting: boolean;
}

export interface PreviewSettings {
    fontSize: number;
    fontFamily: string;
    columns: 1 | 2 | 3;
    showChordDiagrams: boolean;
    scrollSpeed: number;
    theme: 'light' | 'dark';
    chordStyle: 'inline' | 'above';
    transposeAmount: number;
    autoFit: boolean;
    autoFitMinFontSize: number;
    autoFitMaxFontSize: number;
    // Light theme colors
    chordColorLight: string;
    lyricsColorLight: string;
    chordHighlightBackgroundLight: string;
    // Dark theme colors
    chordColorDark: string;
    lyricsColorDark: string;
    chordHighlightBackgroundDark: string;
    useCustomColors: boolean;
    showSectionHeadings: boolean;
    customChordsDisplay: 'diagrams' | 'text' | 'hidden';
    useGridLayout?: boolean;
    // Backup settings before autofit was enabled
    manualSettings?: {
        fontSize: number;
        columns: 1 | 2 | 3;
    };
}

export interface AppState {
    files: ChordProFile[];
    playlists: Playlist[];
    currentFile?: string;
    currentPlaylist?: string;
    editorSettings: EditorSettings;
    previewSettings: PreviewSettings;
    layout: 'editor' | 'preview' | 'split';
    searchQuery: string;
    selectedFiles: string[];
}

export interface SyncStatus {
    isLoading: boolean;
    isComplete?: boolean;
    progress?: number; // 0-100
    current?: number; // current file number
    total?: number; // total files to process
    message?: string;
    error?: string;
    filesProcessed?: number;
}

export interface ConflictResolution {
    fileId: string;
    action: 'keep-local' | 'use-remote' | 'merge';
    resolvedContent?: string; // For manual merge
}

export interface ConflictDialogProps {
    conflicts: ChordProFile[];
    onResolve: (resolutions: ConflictResolution[]) => void;
    onCancel: () => void;
}