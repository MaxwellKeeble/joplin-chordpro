import { StreamLanguage, LanguageSupport } from '@codemirror/language';
import { CompletionContext, autocompletion } from '@codemirror/autocomplete';
import { snippet } from '@codemirror/autocomplete';

export function chordProLanguage() {
    const chordProStreamParser = StreamLanguage.define({
        token(stream) {
            // Directive
            if (stream.match(/^\s*\{[^}]+\}/)) {
                return 'keyword';
            }

            // Chord
            if (stream.match(/\[[^\]]+\]/)) {
                return 'string';
            }

            // Comment
            if (stream.match(/^#.*/)) {
                return 'comment';
            }

            // Section markers
            if (stream.match(/^(Verse|Chorus|Bridge|Intro|Outro|Solo):/i)) {
                return 'heading';
            }

            stream.next();
            return null;
        },

        startState() {
            return {};
        }
    });

    return new LanguageSupport(chordProStreamParser);
}

export function chordProAutocomplete() {
    // Section completions for when typing in braces like {chorus - using simple text replacement first
    const sectionSnippetsForBraces = [
        {
            label: '{chorus}',
            displayLabel: 'Chorus (block)',
            type: 'keyword',
            info: 'Insert chorus section',
            apply: snippet('{start_of_chorus}\n${}\n{end_of_chorus}')
        },
        {
            label: '{verse}',
            displayLabel: 'Verse (block)',
            type: 'keyword',
            info: 'Insert verse section',
            apply: snippet('{start_of_verse}\n${}\n{end_of_verse}')
        },
        {
            label: '{bridge}',
            displayLabel: 'Bridge (block)',
            type: 'keyword',
            info: 'Insert bridge section',
            apply: snippet('{start_of_bridge}\n${}\n{end_of_bridge}')
        },
        {
            label: '{intro}',
            displayLabel: 'Intro (block)',
            type: 'keyword',
            info: 'Insert intro section',
            apply: snippet('{start_of_intro}\n${}\n{end_of_intro}')
        },
        {
            label: '{outro}',
            displayLabel: 'Outro (block)',
            type: 'keyword',
            info: 'Insert outro section',
            apply: snippet('{start_of_outro}\n${}\n{end_of_outro}')
        },
        {
            label: '{solo}',
            displayLabel: 'Solo (block)',
            type: 'keyword',
            info: 'Insert solo section',
            apply: snippet('{start_of_solo}\n${}\n{end_of_solo}')
        },
        {
            label: '{tab}',
            displayLabel: 'Tab (block)',
            type: 'keyword',
            info: 'Insert tab section',
            apply: snippet('{start_of_tab}\n${}\n{end_of_tab}')
        },
        {
            label: '{grid}',
            displayLabel: 'Grid (block)',
            type: 'keyword',
            info: 'Insert grid section',
            apply: snippet('{start_of_grid}\n${}\n{end_of_grid}')
        }
    ];

    // Static fallback list for non-metadata directives as CodeMirror autocomplete options
    const otherDirectives = [
        { label: '{comment:', displayLabel: 'Comment', type: 'keyword', info: '{comment:' },
        { label: '{start_of_chorus}', displayLabel: 'Chorus - start', type: 'keyword', info: '{start_of_chorus}' },
        { label: '{end_of_chorus}', displayLabel: 'Chorus - end', type: 'keyword', info: '{end_of_chorus}' },
        { label: '{start_of_verse}', displayLabel: 'Verse - start', type: 'keyword', info: '{start_of_verse}' },
        { label: '{end_of_verse}', displayLabel: 'Verse - end', type: 'keyword', info: '{end_of_verse}' },
        { label: '{start_of_bridge}', displayLabel: 'Bridge - start', type: 'keyword', info: '{start_of_bridge}' },
        { label: '{end_of_bridge}', displayLabel: 'Bridge - end', type: 'keyword', info: '{end_of_bridge}' },
        { label: '{start_of_intro}', displayLabel: 'Intro - start', type: 'keyword', info: '{start_of_intro}' },
        { label: '{end_of_intro}', displayLabel: 'Intro - end', type: 'keyword', info: '{end_of_intro}' },
        { label: '{start_of_outro}', displayLabel: 'Outro - start', type: 'keyword', info: '{start_of_outro}' },
        { label: '{end_of_outro}', displayLabel: 'Outro - end', type: 'keyword', info: '{end_of_outro}' },
        { label: '{start_of_solo}', displayLabel: 'Solo - start', type: 'keyword', info: '{start_of_solo}' },
        { label: '{end_of_solo}', displayLabel: 'Solo - end', type: 'keyword', info: '{end_of_solo}' },
        { label: '{start_of_tab}', displayLabel: 'Tab - start', type: 'keyword', info: '{start_of_tab}' },
        { label: '{end_of_tab}', displayLabel: 'Tab - end', type: 'keyword', info: '{end_of_tab}' },
        { label: '{start_of_grid}', displayLabel: 'Grid - start', type: 'keyword', info: '{start_of_grid}' },
        { label: '{end_of_grid}', displayLabel: 'Grid - end', type: 'keyword', info: '{end_of_grid}' },
        { label: '{define:', displayLabel: 'Define custom chord', type: 'keyword', info: '{define:' },
    ];

    const directivesPromise = Promise.resolve(otherDirectives);

    function extractChordsFromContent(content: string): Array<{ label: string; type: string; info: string }> {
        const chordRegex = /\[([^\]]+)\]/g;
        const found = new Set<string>();
        let match;
        while ((match = chordRegex.exec(content)) !== null) {
            found.add(match[1]);
        }
        return Array.from(found).map(chord => ({ label: `[${chord}]`, type: 'string', info: 'Chord' }));
    }

    function findUnclosedStartDirectives(content: string, position: number): Array<{ label: string; displayLabel: string; type: string; info: string }> {
        const beforeCursor = content.slice(0, position);

        const startDirectives = [];
        const endDirectives = [];

        const startRegex = /\{start_of_(\w+)\}/g;
        let startMatch;
        while ((startMatch = startRegex.exec(beforeCursor)) !== null) {
            startDirectives.push(startMatch[1]);
        }

        const endRegex = /\{end_of_(\w+)\}/g;
        let endMatch;
        while ((endMatch = endRegex.exec(beforeCursor)) !== null) {
            endDirectives.push(endMatch[1]);
        }

        const unclosed = [];
        for (const start of startDirectives) {
            const startCount = startDirectives.filter(s => s === start).length;
            const endCount = endDirectives.filter(e => e === start).length;
            if (startCount > endCount) {
                unclosed.push(start);
            }
        }

        const suggestions = [...new Set(unclosed)].map(directive => ({
            label: `{end_of_${directive}}`,
            displayLabel: `${directive.charAt(0).toUpperCase() + directive.slice(1)} - end`,
            type: 'keyword',
            info: `{end_of_${directive}}`
        }));

        return suggestions;
    }

    return autocompletion({
        activateOnTyping: true,
        maxRenderedOptions: 50,
        defaultKeymap: true,
        override: [
            (context: CompletionContext) => {
                const word = context.matchBefore(/\{[^}]*/)
                if (word) {
                    return directivesPromise.then((directives) => {
                        const query = word.text.slice(1).toLowerCase();

                        const doc = context.state.doc.toString();
                        const unclosedSuggestions = findUnclosedStartDirectives(doc, word.from);

                        const sectionNames = ['chorus', 'verse', 'bridge', 'intro', 'outro', 'solo', 'tab', 'grid'];
                        const isTypingSection = sectionNames.some(section =>
                            section.startsWith(query.toLowerCase()) && query.length > 0
                        );

                        let allOptions;
                        if (isTypingSection) {
                            allOptions = sectionSnippetsForBraces.filter(s =>
                                s.label.toLowerCase().includes(query)
                            );
                        } else {
                            allOptions = [...(directives || []), ...unclosedSuggestions, ...sectionSnippetsForBraces];
                            allOptions = allOptions.filter((d) => {
                                if (query === '') return true;
                                if (d.label.toLowerCase().includes(query)) return true;
                                if ('match' in d && typeof d.match === 'string' && d.match.toLowerCase().includes(`{${query}`)) return true;
                                return false;
                            });
                        }

                        const filteredOptions = allOptions;

                        if (query === '' && unclosedSuggestions.length > 0 && !isTypingSection) {
                            const regularOptions = filteredOptions.filter(d =>
                                !unclosedSuggestions.some(u => u.label === d.label)
                            );
                            return {
                                from: word.from,
                                to: word.to,
                                options: [...unclosedSuggestions, ...regularOptions]
                            };
                        }

                        const result = {
                            from: word.from,
                            to: word.to,
                            options: filteredOptions
                        };

                        return result;
                    });
                }

                const chord = context.matchBefore(/\[[^\]]*/)
                if (chord) {
                    const doc = context.state.doc.toString();
                    const chordOptions = extractChordsFromContent(doc);
                    const query = chord.text.slice(1).toLowerCase();
                    return {
                        from: chord.from,
                        to: chord.to,
                        options: chordOptions.filter(c =>
                            query === '' ||
                            c.label.toLowerCase().includes(query)
                        )
                    };
                }

                return null;
            }
        ]
    })
}

export default function (context: any) {
    return {
        plugin: function (CodeMirror: any) {
            // How does Joplin register CodeMirror 6 extensions?
            // Usually Joplin expects:
            // return { plugin: function (CodeMirror: any) { ... } } for CM5.
            // But for CM6 it's returned somehow differently. Let me check Joplin plugin documentation if possible, 
            // or see how to inject CM6 extension.
        }
    };
}
