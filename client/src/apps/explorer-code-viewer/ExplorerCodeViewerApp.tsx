import { Box, Center, Code, Loader, ScrollArea, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import kotlin from 'highlight.js/lib/languages/kotlin';
import php from 'highlight.js/lib/languages/php';
import powershell from 'highlight.js/lib/languages/powershell';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { useEffect, useMemo } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

import 'highlight.js/styles/github-dark.min.css';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('php', php);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

function languageFromPath(path: string | null): string | undefined {
	if (!path) {
		return undefined;
	}
	const ext = path.split('.').pop()?.toLowerCase();
	const map: Record<string, string> = {
		js: 'javascript',
		jsx: 'javascript',
		ts: 'typescript',
		tsx: 'typescript',
		py: 'python',
		rb: 'ruby',
		rs: 'rust',
		go: 'go',
		java: 'java',
		c: 'c',
		cpp: 'cpp',
		h: 'c',
		hpp: 'cpp',
		cs: 'csharp',
		php: 'php',
		css: 'css',
		scss: 'scss',
		html: 'xml',
		htm: 'xml',
		sql: 'sql',
		sh: 'bash',
		bash: 'bash',
		zsh: 'bash',
		ps1: 'powershell',
		kt: 'kotlin',
		swift: 'swift',
		vue: 'xml',
		svelte: 'xml',
	};
	return ext ? map[ext] : undefined;
}

export default function ExplorerCodeViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-code-viewer',
		fileTypes: ['code'],
	});

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Код');

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
				e.preventDefault();
				void openFile();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [openFile]);

	const contentQuery = useQuery({
		queryKey: ['explorer', 'code', currentPath ?? ''],
		queryFn: () => fetchExplorerText(currentPath!),
		enabled: Boolean(currentPath),
	});

	const highlighted = useMemo(() => {
		const source = contentQuery.data ?? '';
		if (!source) {
			return '';
		}
		const lang = languageFromPath(currentPath);
		try {
			if (lang && hljs.getLanguage(lang)) {
				return hljs.highlight(source, { language: lang }).value;
			}
			return hljs.highlightAuto(source).value;
		} catch {
			return source
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}
	}, [contentQuery.data, currentPath]);

	return (
		<Box h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			{!currentPath ? (
				<Center style={{ flex: 1 }} p="md">
					<Text c="dimmed">Файл → Открыть… или откройте код из Проводника</Text>
				</Center>
			) : contentQuery.isLoading ? (
				<Center style={{ flex: 1 }}>
					<Loader size="sm" />
				</Center>
			) : contentQuery.isError ? (
				<Center style={{ flex: 1 }}>
					<Text c="red">Не удалось загрузить файл</Text>
				</Center>
			) : (
				<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
					<Code
						block
						style={{
							margin: 0,
							borderRadius: 0,
							minHeight: '100%',
							fontSize: 13,
							lineHeight: 1.5,
							background: '#0d1117',
							color: '#e6edf3',
						}}
					>
						<pre style={{ margin: 0 }} className="hljs">
							<code dangerouslySetInnerHTML={{ __html: highlighted }} />
						</pre>
					</Code>
				</ScrollArea>
			)}
		</Box>
	);
}
