import { mergeAttributes, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

import {
	formatWikilinkMarkdown,
	normalizeWikilinkTitle,
} from './wikilinkHelpers';

export interface WikilinkSuggestion {
	title: string;
	path: string;
}

export interface WikilinkAutocompleteState {
	from: number;
	to: number;
	query: string;
	selectedIndex: number;
	clientRect: DOMRect | null;
}

export interface WikilinkExtensionOptions {
	getSuggestions: (query: string) => WikilinkSuggestion[];
	onAutocompleteStateChange?: (state: WikilinkAutocompleteState | null) => void;
	onWikilinkClick?: (title: string) => void;
	isBrokenLink?: (title: string) => boolean;
}

export interface WikilinkExtensionStorage {
	autocomplete: WikilinkAutocompleteState | null;
}

const wikilinkAutocompleteKey = new PluginKey<WikilinkAutocompleteState | null>('wikilinkAutocomplete');

const WIKILINK_TOKEN_PATTERN =
	/^\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;

function findWikilinkTrigger(doc: import('@tiptap/pm/model').Node, pos: number) {
	const maxLookback = 120;
	const from = Math.max(0, pos - maxLookback);
	const textBefore = doc.textBetween(from, pos, '\n', '\0');
	const openIndex = textBefore.lastIndexOf('[[');
	if (openIndex < 0) {
		return null;
	}
	const query = textBefore.slice(openIndex + 2);
	if (query.includes(']]') || query.includes('\n')) {
		return null;
	}
	return {
		from: from + openIndex,
		to: pos,
		query,
	};
}

export function createWikilinkExtension(options: WikilinkExtensionOptions) {
	return Node.create<WikilinkExtensionOptions, WikilinkExtensionStorage>({
		name: 'wikilink',
		inline: true,
		group: 'inline',
		atom: true,
		selectable: true,

		addOptions() {
			return {
				getSuggestions: () => [],
				onAutocompleteStateChange: undefined,
				onWikilinkClick: undefined,
				isBrokenLink: undefined,
			};
		},

		addStorage() {
			return {
				autocomplete: null,
			};
		},

		addAttributes() {
			return {
				title: { default: null },
				alias: { default: null },
				heading: { default: null },
			};
		},

		parseHTML() {
			return [{ tag: 'span[data-wikilink]' }];
		},

		renderHTML({ node, HTMLAttributes }) {
			const display = (node.attrs.alias as string | null) ?? (node.attrs.title as string);
			const broken = options.isBrokenLink?.(node.attrs.title as string) ?? false;
			return [
				'span',
				mergeAttributes(HTMLAttributes, {
					'data-wikilink': '',
					'data-title': node.attrs.title,
					class: broken ? 'pkb-wikilink pkb-wikilink-broken' : 'pkb-wikilink',
				}),
				display,
			];
		},

		markdownTokenizer: {
			name: 'wikilink',
			level: 'inline',
			start(src) {
				const index = src.indexOf('[[');
				return index >= 0 ? index : -1;
			},
			tokenize(src) {
				const match = WIKILINK_TOKEN_PATTERN.exec(src);
				if (!match) {
					return undefined;
				}
				const title = normalizeWikilinkTitle(match[1] ?? '');
				if (!title) {
					return undefined;
				}
				return {
					type: 'wikilink',
					raw: match[0],
					title,
					heading: match[2]?.trim() || null,
					alias: match[3]?.trim() || null,
				};
			},
		},

		parseMarkdown(token, helpers) {
			return helpers.createNode('wikilink', {
				title: token.title,
				alias: token.alias ?? null,
				heading: token.heading ?? null,
			});
		},

		renderMarkdown(node) {
			return formatWikilinkMarkdown(
				node.attrs?.title ?? '',
				node.attrs?.alias,
				node.attrs?.heading,
			);
		},

		addProseMirrorPlugins() {
			const extension = this;

			return [
				new Plugin<WikilinkAutocompleteState | null>({
					key: wikilinkAutocompleteKey,
					state: {
						init: (): WikilinkAutocompleteState | null => null,
						apply(tr, prev: WikilinkAutocompleteState | null, _oldState, newState) {
							const meta = tr.getMeta(wikilinkAutocompleteKey) as
								| { type: 'set'; state: WikilinkAutocompleteState | null }
								| { type: 'select'; index: number }
								| undefined;

							if (meta?.type === 'set') {
								extension.storage.autocomplete = meta.state;
								options.onAutocompleteStateChange?.(meta.state);
								return meta.state;
							}

							if (meta?.type === 'select' && prev) {
								const next = { ...prev, selectedIndex: meta.index };
								extension.storage.autocomplete = next;
								options.onAutocompleteStateChange?.(next);
								return next;
							}

							if (!tr.docChanged && !tr.selectionSet) {
								return prev;
							}

							const { from } = newState.selection;
							const trigger = findWikilinkTrigger(newState.doc, from);
							if (!trigger) {
								if (prev) {
									extension.storage.autocomplete = null;
									options.onAutocompleteStateChange?.(null);
								}
								return null;
							}

							const coords = extension.editor.view.coordsAtPos(from);
							const next: WikilinkAutocompleteState = {
								from: trigger.from,
								to: trigger.to,
								query: trigger.query,
								selectedIndex: prev?.from === trigger.from ? prev.selectedIndex : 0,
								clientRect: new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top),
							};
							extension.storage.autocomplete = next;
							options.onAutocompleteStateChange?.(next);
							return next;
						},
					},
					props: {
						handleClick(view, pos, event) {
							const target = event.target as HTMLElement | null;
							const wikilinkEl = target?.closest?.('[data-wikilink]');
							if (!wikilinkEl) {
								return false;
							}
							const title = wikilinkEl.getAttribute('data-title');
							if (title) {
								options.onWikilinkClick?.(title);
								return true;
							}
							const node = view.state.doc.nodeAt(pos);
							if (node?.type.name === extension.name) {
								options.onWikilinkClick?.(node.attrs.title as string);
								return true;
							}
							return false;
						},
						handleKeyDown(view, event) {
							const state = wikilinkAutocompleteKey.getState(view.state);
							if (!state) {
								return false;
							}

							const suggestions = options.getSuggestions(state.query);

							if (event.key === 'Escape') {
								view.dispatch(view.state.tr.setMeta(wikilinkAutocompleteKey, { type: 'set', state: null }));
								return true;
							}

							if (event.key === 'ArrowDown') {
								event.preventDefault();
								const nextIndex = Math.min(state.selectedIndex + 1, Math.max(suggestions.length - 1, 0));
								view.dispatch(
									view.state.tr.setMeta(wikilinkAutocompleteKey, { type: 'select', index: nextIndex }),
								);
								return true;
							}

							if (event.key === 'ArrowUp') {
								event.preventDefault();
								const nextIndex = Math.max(state.selectedIndex - 1, 0);
								view.dispatch(
									view.state.tr.setMeta(wikilinkAutocompleteKey, { type: 'select', index: nextIndex }),
								);
								return true;
							}

							if (event.key === 'Enter' || event.key === 'Tab') {
								const selected = suggestions[state.selectedIndex] ?? suggestions[0];
								if (selected) {
									event.preventDefault();
									extension.editor
										.chain()
										.focus()
										.deleteRange({ from: state.from, to: state.to })
										.insertContent({
											type: extension.name,
											attrs: {
												title: selected.title,
												alias: null,
												heading: null,
											},
										})
										.run();
									view.dispatch(view.state.tr.setMeta(wikilinkAutocompleteKey, { type: 'set', state: null }));
									return true;
								}
							}

							return false;
						},
					},
				}),
			];
		},
	});
}

export { formatWikilinkMarkdown, normalizeWikilinkTitle };
