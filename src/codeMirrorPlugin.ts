import { chordProLanguage, chordProAutocomplete } from './chordProLanguage';

export default function (context: any) {
    return {
        plugin: function (CodeMirror: any) {
            // Note: If Joplin is passing CodeMirror 6 directly here, or if we just need to return an extension.
            // In CodeMirror 6, for Joplin, the plugin function is expected to return an Extension.
            // wait, we need to make sure we're registering it correctly as per Joplin API for CM6 content scripts.
            // https://joplinapp.org/help/api/references/plugin_api/classes/joplinContentscripts#register
            // For CM6 the script export should define a plugin that returns CM6 extensions.
            // Actually, for Joplin CM6 content scripts, it expects an extension array to be returned.
            // Example:
            return [
                chordProLanguage(),
                chordProAutocomplete()
            ];
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
