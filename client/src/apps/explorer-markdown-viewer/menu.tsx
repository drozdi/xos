import type { AppMenuConfig } from '@/core/appMenu/types';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { explorerOpenPickerConsumerId } from '@/features/explorer/useExplorerSatelliteFile';


import {
	useMarkdownEditorStore,
	type MarkdownFormatCommand,
} from './markdownEditorStore';


const MARKDOWN_FILE_TYPES = ['markdown'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown'];


function formatIcon(label: string) {
	return (
		<span style={{ fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
			{label}
		</span>
	);
}


function requestFormat(windowId: string, command: MarkdownFormatCommand) {
	useMarkdownEditorStore.getState().requestFormat(windowId, command);
}


const menu: AppMenuConfig = {
	layout: 'combined',
	items: [
		{
			id: 'file',
			type: 'submenu',
			label: 'Файл',
			items: [
				{
					id: 'file-open',
					label: 'Открыть…',
					shortcut: 'Ctrl+O',
					onClick: async (ctx) => {
						const session = useMarkdownEditorStore.getState().getSession(ctx.windowId);
						await openExplorerPicker({
							mode: 'open',
							consumerAppId: explorerOpenPickerConsumerId(ctx.appId, ctx.windowId),
							fileTypes: MARKDOWN_FILE_TYPES,
							extensions: MARKDOWN_EXTENSIONS,
							initialPath: session.path ?? undefined,
							title: 'Открыть Markdown',
						});
					},
				},
				{
					id: 'file-save',
					label: 'Сохранить',
					shortcut: 'Ctrl+S',
					disabled: (ctx) => {
						const session = useMarkdownEditorStore.getState().getSession(ctx.windowId);
						return !session.path || !session.dirty;
					},
					onClick: (ctx) => {
						useMarkdownEditorStore.getState().requestSave(ctx.windowId);
					},
				},
				{
					id: 'file-save-as',
					label: 'Сохранить как…',
					onClick: (ctx) => {
						useMarkdownEditorStore.getState().requestSaveAs(ctx.windowId);
					},
				},
				{
					id: 'file-close',
					label: 'Закрыть',
					onClick: (ctx) => {
						void ctx.coreApi.window.close();
					},
				},
			],
		},
		{
			id: 'view',
			type: 'submenu',
			label: 'Вид',
			items: [
				{
					id: 'view-edit',
					label: 'Редактор',
					onClick: (ctx) => {
						useMarkdownEditorStore.getState().setViewMode(ctx.windowId, 'edit');
					},
				},
				{
					id: 'view-split',
					label: 'Разделённый',
					onClick: (ctx) => {
						useMarkdownEditorStore.getState().setViewMode(ctx.windowId, 'split');
					},
				},
				{
					id: 'view-preview',
					label: 'Просмотр',
					onClick: (ctx) => {
						useMarkdownEditorStore.getState().setViewMode(ctx.windowId, 'preview');
					},
				},
			],
		},
	],
	toolbarItems: [
		{
			id: 'fmt-bold',
			label: 'Жирный',
			icon: formatIcon('B'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'bold'),
		},
		{
			id: 'fmt-italic',
			label: 'Курсив',
			icon: formatIcon('I'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'italic'),
		},
		{
			id: 'fmt-h1',
			label: 'Заголовок 1',
			icon: formatIcon('H1'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'heading1'),
		},
		{
			id: 'fmt-h2',
			label: 'Заголовок 2',
			icon: formatIcon('H2'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'heading2'),
		},
		{
			id: 'fmt-h3',
			label: 'Заголовок 3',
			icon: formatIcon('H3'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'heading3'),
		},
		{
			id: 'fmt-ul',
			label: 'Список',
			icon: formatIcon('•'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'ul'),
		},
		{
			id: 'fmt-ol',
			label: 'Нумерованный список',
			icon: formatIcon('1.'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'ol'),
		},
		{
			id: 'fmt-quote',
			label: 'Цитата',
			icon: formatIcon('“'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'quote'),
		},
		{
			id: 'fmt-code',
			label: 'Код',
			icon: formatIcon('<>'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'code'),
		},
		{
			id: 'fmt-code-block',
			label: 'Блок кода',
			icon: formatIcon('{ }'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'codeBlock'),
		},
		{
			id: 'fmt-link',
			label: 'Ссылка',
			icon: formatIcon('URL'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'link'),
		},
		{
			id: 'fmt-hr',
			label: 'Разделитель',
			icon: formatIcon('—'),
			onClick: (ctx) => requestFormat(ctx.windowId, 'hr'),
		},
	],
};


export default menu;

