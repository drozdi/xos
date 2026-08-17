import { Box, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import classes from './markdownViewer.module.css';

interface MarkdownPreviewProps {
	content: string;
	variant?: 'default' | 'reading';
}

export function MarkdownPreview({ content, variant = 'default' }: MarkdownPreviewProps) {
	const className =
		variant === 'reading'
			? `${classes.markdownViewer} ${classes.markdownReading}`
			: classes.markdownViewer;

	return (
		<Box className={className} p="md" maw={variant === 'reading' ? 760 : 900} mx="auto" pb="xl">
			{content.trim() ? (
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
			) : (
				<Text c="dimmed">Нет содержимого для просмотра</Text>
			)}
		</Box>
	);
}
