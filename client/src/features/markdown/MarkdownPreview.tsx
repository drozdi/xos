import { Anchor, Box, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Fragment, useMemo } from 'react';

import {
	getWikilinkDisplayText,
	splitMarkdownByWikilinks,
	type WikilinkTextSegment,
} from '@/features/pkb/editor/wikilinkHelpers';

import classes from './markdownViewer.module.css';
import pkbClasses from '@/features/pkb/editor/pkbEditor.module.css';

interface MarkdownPreviewProps {
	content: string;
	variant?: 'default' | 'reading';
	onWikilinkClick?: (title: string) => void;
	isBrokenWikilink?: (title: string) => boolean;
}

function WikilinkPreview({
	link,
	onWikilinkClick,
	isBrokenWikilink,
}: {
	link: NonNullable<WikilinkTextSegment['link']>;
	onWikilinkClick?: (title: string) => void;
	isBrokenWikilink?: (title: string) => boolean;
}) {
	const broken = isBrokenWikilink?.(link.title) ?? false;
	const display = getWikilinkDisplayText(link);

	if (!onWikilinkClick) {
		return <span className={broken ? pkbClasses.pkbWikilinkBroken : pkbClasses.pkbWikilink}>{display}</span>;
	}

	return (
		<Anchor
			component="button"
			type="button"
			className={broken ? pkbClasses.pkbWikilinkBroken : pkbClasses.pkbWikilink}
			onClick={() => onWikilinkClick(link.title)}
			styles={{ root: { fontWeight: 'inherit', verticalAlign: 'baseline' } }}
		>
			{display}
		</Anchor>
	);
}

function MarkdownSegment({
	text,
	variant,
}: {
	text: string;
	variant: 'default' | 'reading';
}) {
	const className =
		variant === 'reading'
			? `${classes.markdownViewer} ${classes.markdownReading}`
			: classes.markdownViewer;

	if (!text.trim()) {
		return null;
	}

	return (
		<Box className={className} component="span" display="inline">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
		</Box>
	);
}

export function MarkdownPreview({
	content,
	variant = 'default',
	onWikilinkClick,
	isBrokenWikilink,
}: MarkdownPreviewProps) {
	const className =
		variant === 'reading'
			? `${classes.markdownViewer} ${classes.markdownReading}`
			: classes.markdownViewer;

	const segments = useMemo(() => splitMarkdownByWikilinks(content), [content]);
	const hasWikilinks = segments.some((segment) => segment.type === 'wikilink');

	if (!content.trim()) {
		return (
			<Box className={className} p="md" maw={variant === 'reading' ? 760 : 900} mx="auto" pb="xl">
				<Text c="dimmed">Нет содержимого для просмотра</Text>
			</Box>
		);
	}

	if (!hasWikilinks) {
		return (
			<Box className={className} p="md" maw={variant === 'reading' ? 760 : 900} mx="auto" pb="xl">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
			</Box>
		);
	}

	return (
		<Box className={className} p="md" maw={variant === 'reading' ? 760 : 900} mx="auto" pb="xl">
			{segments.map((segment, index) => {
				if (segment.type === 'wikilink' && segment.link) {
					return (
						<WikilinkPreview
							key={`wikilink-${index}`}
							link={segment.link}
							onWikilinkClick={onWikilinkClick}
							isBrokenWikilink={isBrokenWikilink}
						/>
					);
				}
				return (
					<Fragment key={`text-${index}`}>
						<MarkdownSegment text={segment.value} variant={variant} />
					</Fragment>
				);
			})}
		</Box>
	);
}
