import {
	Box,
	Button,
	FileButton,
	Group,
	SegmentedControl,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useCallback, useId, useRef, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { uploadIblockFile } from '@/core/api/endpoints/iblockApi';
import {
	MARKDOWN_VIEW_MODE_LABELS,
	MarkdownPreview,
	defaultMarkdownViewMode,
	normalizeMarkdownViewMode,
	showsMarkdownPreview,
	showsMarkdownSource,
	showsMarkdownWysiwyg,
	type MarkdownViewMode,
} from '@/features/markdown';
import { MarkdownWysiwygEditor } from '@/features/markdown/MarkdownWysiwygEditor';

import { insertMarkdownImage } from './insertMarkdownImage';

interface IblockMarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	readOnly?: boolean;
	label?: string;
	minHeight?: number;
}

export function IblockMarkdownEditor({
	value,
	onChange,
	readOnly = false,
	label = 'Текст (Markdown)',
	minHeight = 280,
}: IblockMarkdownEditorProps) {
	const editorKey = useId();
	const [viewMode, setViewMode] = useState<MarkdownViewMode>(() =>
		defaultMarkdownViewMode(!readOnly),
	);
	const [uploading, setUploading] = useState(false);
	const [formatNonce, setFormatNonce] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const mode = normalizeMarkdownViewMode(viewMode);
	const showWysiwyg = showsMarkdownWysiwyg(mode) && !readOnly;

	const handleUpload = useCallback(
		async (file: File | null) => {
			if (!file || readOnly) return;
			setUploading(true);
			try {
				const uploaded = await uploadIblockFile(file);
				const ta = textareaRef.current;
				const start = ta?.selectionStart ?? value.length;
				const end = ta?.selectionEnd ?? start;
				const next = insertMarkdownImage(value, file.name, uploaded.src, start, end);
				onChange(next.value);
				notifications.show({ message: 'Картинка вставлена', color: 'green' });
				requestAnimationFrame(() => {
					const el = textareaRef.current;
					if (el) {
						el.focus();
						el.setSelectionRange(next.selectionStart, next.selectionEnd);
					}
				});
			} catch (error) {
				notifyApiError(error, 'Ошибка загрузки картинки');
			} finally {
				setUploading(false);
			}
		},
		[onChange, readOnly, value],
	);

	return (
		<Stack gap="xs">
			<Group justify="space-between" align="center" wrap="wrap">
				<Text size="sm" fw={500}>
					{label}
				</Text>
				<Group gap="xs">
					{!readOnly && (
						<FileButton onChange={handleUpload} accept="image/*" disabled={uploading}>
							{(props) => (
								<Button
									{...props}
									size="xs"
									variant="light"
									leftSection={<IconPhoto size={14} />}
									loading={uploading}
								>
									Картинка
								</Button>
							)}
						</FileButton>
					)}
					<SegmentedControl
						size="xs"
						value={mode}
						onChange={(v) => setViewMode(normalizeMarkdownViewMode(v))}
						data={(Object.keys(MARKDOWN_VIEW_MODE_LABELS) as MarkdownViewMode[]).map(
							(key) => ({
								value: key,
								label: MARKDOWN_VIEW_MODE_LABELS[key],
							}),
						)}
					/>
				</Group>
			</Group>
			<Box
				style={{
					minHeight,
					height: showWysiwyg ? minHeight : undefined,
					border: '1px solid var(--mantine-color-default-border)',
					borderRadius: 'var(--mantine-radius-sm)',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{showWysiwyg && (
					<Box style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
						<MarkdownWysiwygEditor
							content={value}
							onChange={onChange}
							formatNonce={formatNonce}
							formatCommand={null}
							undoNonce={0}
							redoNonce={0}
							onFormatHandled={() => setFormatNonce(0)}
							embedded
							minHeight={minHeight}
						/>
					</Box>
				)}
				{showsMarkdownSource(mode) && (
					<Textarea
						ref={textareaRef}
						value={value}
						onChange={(e) => onChange(e.currentTarget.value)}
						readOnly={readOnly}
						autosize
						minRows={12}
						styles={{
							input: {
								border: 'none',
								borderRadius: 0,
								fontFamily: 'var(--mantine-font-family-monospace)',
								minHeight,
							},
						}}
					/>
				)}
				{showsMarkdownPreview(mode) && (
					<MarkdownPreview content={value} variant="reading" />
				)}
				{showsMarkdownWysiwyg(mode) && readOnly && (
					<MarkdownPreview content={value} key={editorKey} />
				)}
			</Box>
		</Stack>
	);
}
