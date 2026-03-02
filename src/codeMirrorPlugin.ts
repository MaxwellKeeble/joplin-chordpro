import { chordProLanguage, chordProAutocomplete, chordProHighlighter } from './chordProLanguage';

export default function (context: any) {
    return {
        plugin: function (codeMirrorWrapper: any) {
            codeMirrorWrapper.addExtension([
                chordProLanguage(),
                chordProAutocomplete(),
                chordProHighlighter
            ]);
        },
        codeMirrorResources: [],
        codeMirrorOptions: {},
        assets: function () {
            return [
                { name: 'chordpro.css' }
            ];
        }
    };
}
