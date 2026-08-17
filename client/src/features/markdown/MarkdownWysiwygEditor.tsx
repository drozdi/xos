import { RichTextEditor, Link } from '@mantine/tiptap';
import { Markdown } from '@tiptap/markdown';
import type { AnyExtension } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useMemo, useRef } from 'react';

import type { MarkdownFormatCommand } from './markdownEditorStore';
import classes from './markdownViewer.module.css';

interface MarkdownWysiwygEditorProps {
	content: string;
	onChange: (content: string) => void;
	formatNonce: number;
	formatCommand: MarkdownFormatCommand | null;
	undoNonce: number;
	redoNonce: number;
	onFormatHandled: () => void;
	extraExtensions?: AnyExtension[];
	onEditorReady?: (editor: NonNullable<ReturnType<typeof useEditor>>) => void;
}

function applyFormatCommand(editor: NonNullable<ReturnType<typeof useEditor>>, command: MarkdownFormatCommand) {
	const chain = editor.chain().focus();

	switch (command) {
		case 'bold':
			chain.toggleBold().run();
			return;
		case 'italic':
			chain.toggleItalic().run();
			return;
		case 'heading1':
			chain.toggleHeading({ level: 1 }).run();
			return;
		case 'heading2':
			chain.toggleHeading({ level: 2 }).run();
			return;
		case 'heading3':
			chain.toggleHeading({ level: 3 }).run();
			return;
		case 'ul':
			chain.toggleBulletList().run();
			return;
		case 'ol':
			chain.toggleOrderedList().run();
			return;
		case 'quote':
			chain.toggleBlockquote().run();
			return;
		case 'code':
			chain.toggleCode().run();
			return;
		case 'codeBlock':
			chain.toggleCodeBlock().run();
			return;
		case 'link': {
			const previousUrl = editor.getAttributes('link').href as string | undefined;
			chain.extendMarkRange('link').setLink({ href: previousUrl || 'url' }).run();
			return;
		}
		case 'hr':
			chain.setHorizontalRule().run();
			return;
		default:
			return;
	}
}

export function MarkdownWysiwygEditor({
	content,
	onChange,
	formatNonce,
	formatCommand,
	undoNonce,
	redoNonce,
	onFormatHandled,
	extraExtensions = [],
	onEditorReady,
}: MarkdownWysiwygEditorProps) {
	const syncedMarkdownRef = useRef(content);

	const extensions = useMemo(
		() => [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Underline,
			Link.configure({ openOnClick: false }),
			...extraExtensions,
			Markdown,
		],
		[extraExtensions],
	);

	const editor = useEditor({
		extensions,
		content: content || '',
		contentType: 'markdown',
		onUpdate: ({ editor: current }) => {
			const markdown = current.getMarkdown();
			if (markdown === syncedMarkdownRef.current) {
				return;
			}
			syncedMarkdownRef.current = markdown;
			onChange(markdown);
		},
	});

	useEffect(() => {
		if (!editor || editor.isDestroyed) {
			return;
		}
		onEditorReady?.(editor);
	}, [editor, onEditorReady]);

	useEffect(() => {
		if (!editor || editor.isDestroyed) {
			return;
		}
		if (content === syncedMarkdownRef.current) {
			return;
		}
		syncedMarkdownRef.current = content;
		editor.commands.setContent(content, { contentType: 'markdown', emitUpdate: false });
	}, [content, editor]);

	useEffect(() => {
		if (!editor || editor.isDestroyed || formatNonce === 0 || !formatCommand) {
			return;
		}
		applyFormatCommand(editor, formatCommand);
		onFormatHandled();
	}, [editor, formatCommand, formatNonce, onFormatHandled]);

	useEffect(() => {
		if (!editor || editor.isDestroyed || undoNonce === 0) {
			return;
		}
		editor.chain().focus().undo().run();
	}, [editor, undoNonce]);

	useEffect(() => {
		if (!editor || editor.isDestroyed || redoNonce === 0) {
			return;
		}
		editor.chain().focus().redo().run();
	}, [editor, redoNonce]);

	return (
		<RichTextEditor editor={editor} className={classes.markdownWysiwyg}>
			<RichTextEditor.Content className={classes.markdownViewer} />
		</RichTextEditor>
	);
}
