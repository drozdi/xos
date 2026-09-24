import { RichTextEditor, Link } from '@mantine/tiptap';
import { Markdown } from '@tiptap/markdown';
import type { AnyExtension } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
	/** Form embed: fixed min-height instead of filling a flex parent. */
	embedded?: boolean;
	minHeight?: number;
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
	embedded = false,
	minHeight = 280,
}: MarkdownWysiwygEditorProps) {
	const syncedMarkdownRef = useRef(content);

	const extensions = useMemo(
		() => [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Underline,
			Link.configure({ openOnClick: false }),
			Image.configure({ inline: false, allowBase64: false }),
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
		<RichTextEditor
			editor={editor}
			className={embedded ? `${classes.markdownWysiwyg} ${classes.markdownWysiwygEmbedded}` : classes.markdownWysiwyg}
			classNames={{ content: classes.markdownWysiwygContent }}
			style={embedded ? { minHeight, height: '100%' } : undefined}
		>
			{embedded ? (
				<RichTextEditor.Toolbar sticky stickyOffset={0}>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Bold />
						<RichTextEditor.Italic />
						<RichTextEditor.Underline />
						<RichTextEditor.Strikethrough />
						<RichTextEditor.ClearFormatting />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.H1 />
						<RichTextEditor.H2 />
						<RichTextEditor.H3 />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.BulletList />
						<RichTextEditor.OrderedList />
						<RichTextEditor.Blockquote />
						<RichTextEditor.Hr />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Code />
						<RichTextEditor.CodeBlock />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Link />
						<RichTextEditor.Unlink />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Undo />
						<RichTextEditor.Redo />
					</RichTextEditor.ControlsGroup>
				</RichTextEditor.Toolbar>
			) : null}
			<RichTextEditor.Content className={classes.markdownViewer} />
		</RichTextEditor>
	);
}
