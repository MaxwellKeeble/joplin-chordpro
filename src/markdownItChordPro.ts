module.exports = {
	default: function (_context: any) {
		return {
			plugin: function (markdownIt: any, _options: any) {
				const defaultRender = markdownIt.renderer.rules.fence || function (tokens: any, idx: any, options: any, env: any, self: any) {
					return self.renderToken(tokens, idx, options);
				};

				// --- 1. Auto-detect pure ChordPro files ---
				markdownIt.core.ruler.before('normalize', 'chordpro_auto_detect', function (state: any) {
					const text = state.src;
					if (!text) return;

					// A simple heuristic for "entirely chordpro":
					// 1. It has some chordpro syntax: `[Chords]` or `{directives: ...}`
					// 2. It doesn't have obvious markdown syntax like `# header`, `* list`, `- list`, etc.

					const hasChordPro = /\[[A-Z][a-z0-9#\/]*\]/i.test(text) || /^\{[a-z]+:.*\}$/m.test(text);

					// Checking for common markdown that chordpro usually wouldn't have at the start of a line.
					// We must be careful not to trigger on lyrics that just happen to start with these.
					// For example, Markdown headers `# `, lists `- `, `* `, blockquotes `> `, code blocks ` ``` `
					const hasMarkdown = /^#{1,6}\s/m.test(text) ||
						/^\s*[-*+]\s/m.test(text) ||
						/^\s*>\s/m.test(text) ||
						/^```/m.test(text);

					if (hasChordPro && !hasMarkdown) {
						// It seems to be entirely chordpro. Wrap it in a chordpro code block so the renderer picks it up.
						// We don't want to double wrap if it's already wrapped, but `hasMarkdown` check above 
						// ensures `hasMarkdown` is true if ` ``` ` exists, so it won't execute if already wrapped.
						state.src = '```chordpro\n' + text + '\n```';
					}
				});

				// --- 2. Render chordpro blocks ---
				markdownIt.renderer.rules.fence = function (tokens: any, idx: any, options: any, env: any, self: any) {
					const token = tokens[idx];
					if (token.info !== 'chordpro') {
						return defaultRender(tokens, idx, options, env, self);
					}

					const content = token.content;
					try {
						const { parseChordPro, convertChordProToHTML } = require('./chordProParser');
						const parsed = parseChordPro(content);
						const html = convertChordProToHTML(parsed, {
							// For markdownIt rendering we defer styling formats to the injected dynamic CSS.
							showSectionHeadings: true,
							showHeader: true,
							addSectionToggles: false,
							useGridLayout: false, // Fallback to flow layout - CSS column-count handles the grid
						});
						return html;
					} catch (e: any) {
						return `<pre>Error rendering chordpro: ${escapeHtml(e.toString())}</pre>`;
					}
				};

				function escapeHtml(unsafe: string) {
					return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
				}
			},
			assets: function () {
				return [
					{ name: 'chordpro.css' },
					{ name: 'chordpro-dynamic.css' }
				];
			},
		}
	}
}
