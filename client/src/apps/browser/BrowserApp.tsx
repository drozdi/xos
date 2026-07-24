import { Alert, Button, Flex, Input, Spin, Tooltip } from 'antd';
import { HomeOutlined, RedoOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { XOS_WINDOW_NO_DRAG_CLASS } from '@/core/windowManager/windowDrag';

import { fetchBrowserPage } from './browserApi';
import { BrowserNewTab } from './BrowserNewTab';
import {
	BROWSER_HOME,
	getAddressValue,
	getBrowserTitle,
	normalizeBrowserUrl,
} from './browserUtils';

interface NavState {
	history: string[];
	index: number;
}

export default function BrowserApp() {
	const [address, setAddress] = useState('');
	const [pageUrl, setPageUrl] = useState(BROWSER_HOME);
	const [nav, setNav] = useState<NavState>({ history: [BROWSER_HOME], index: 0 });
	const [loading, setLoading] = useState(false);
	const [frameError, setFrameError] = useState<string | null>(null);
	const [frameHtml, setFrameHtml] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useWindowTitle(getBrowserTitle(pageUrl));

	const canGoBack = nav.index > 0;
	const canGoForward = nav.index < nav.history.length - 1;
	const isHome = pageUrl === BROWSER_HOME;

	const openPage = useCallback((url: string) => {
		setPageUrl(url);
		setAddress(getAddressValue(url));
		setFrameError(null);
		if (url === BROWSER_HOME) {
			setFrameHtml(null);
			setLoading(false);
		}
	}, []);

	const navigate = useCallback(
		(rawUrl: string, pushHistory = true) => {
			const normalized = normalizeBrowserUrl(rawUrl);
			if (!normalized) {
				return;
			}

			openPage(normalized);

			if (!pushHistory) {
				return;
			}

			setNav((current) => {
				const truncated = current.history.slice(0, current.index + 1);
				if (truncated[truncated.length - 1] === normalized) {
					return current;
				}
				const history = [...truncated, normalized];
				return { history, index: history.length - 1 };
			});
		},
		[openPage],
	);

	useEffect(() => {
		if (isHome) {
			return;
		}

		let cancelled = false;
		setLoading(true);
		setFrameError(null);

		void fetchBrowserPage(pageUrl)
			.then((html) => {
				if (cancelled) {
					return;
				}
				setFrameHtml(html);
			})
			.catch((error: unknown) => {
				if (cancelled) {
					return;
				}
				setFrameHtml(null);
				setFrameError(error instanceof Error ? error.message : 'Не удалось загрузить страницу');
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [isHome, pageUrl, reloadToken]);

	const goBack = () => {
		if (!canGoBack) {
			return;
		}
		const nextIndex = nav.index - 1;
		const url = nav.history[nextIndex] ?? BROWSER_HOME;
		setNav((current) => ({ ...current, index: nextIndex }));
		openPage(url);
	};

	const goForward = () => {
		if (!canGoForward) {
			return;
		}
		const nextIndex = nav.index + 1;
		const url = nav.history[nextIndex] ?? BROWSER_HOME;
		setNav((current) => ({ ...current, index: nextIndex }));
		openPage(url);
	};

	const reload = () => {
		if (isHome) {
			return;
		}
		setReloadToken((value) => value + 1);
	};

	const goHome = () => {
		navigate(BROWSER_HOME);
	};

	const submitAddress = () => {
		navigate(address || BROWSER_HOME);
	};

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<Flex
				gap="small"
				wrap="nowrap"
				align="center"
				className={XOS_WINDOW_NO_DRAG_CLASS}
				style={{
					padding: 8,
					flexShrink: 0,
					borderBottom: '1px solid var(--xos-shell-border)',
					background: 'var(--xos-shell-bg)',
				}}
			>
				<Tooltip title="Назад">
					<Button
						type="text"
						disabled={!canGoBack}
						onClick={goBack}
						aria-label="Назад"
						icon={<RollbackOutlined style={{ fontSize: 18 }} />}
					/>
				</Tooltip>
				<Tooltip title="Вперёд">
					<Button
						type="text"
						disabled={!canGoForward}
						onClick={goForward}
						aria-label="Вперёд"
						icon={<RedoOutlined style={{ fontSize: 18 }} />}
					/>
				</Tooltip>
				<Tooltip title="Обновить">
					<Button
						type="text"
						disabled={isHome}
						onClick={reload}
						aria-label="Обновить"
						icon={<ReloadOutlined style={{ fontSize: 18 }} />}
					/>
				</Tooltip>
				<Tooltip title="Домой">
					<Button type="text" onClick={goHome} aria-label="Домой" icon={<HomeOutlined style={{ fontSize: 18 }} />} />
				</Tooltip>
				<Input
					style={{ flex: 1 }}
					value={address}
					placeholder="Адрес или поиск"
					onChange={(event) => setAddress(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							submitAddress();
						}
					}}
					suffix={loading ? <Spin size="small" /> : null}
				/>
			</Flex>

			{frameError ? (
				<Alert
					type="error"
					showIcon
					message="Не удалось открыть страницу"
					description={frameError}
					style={{ flexShrink: 0, margin: '12px 12px 0' }}
				/>
			) : null}

			<div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
				{isHome ? (
					<BrowserNewTab onNavigate={(url) => navigate(url)} />
				) : loading && !frameHtml ? (
					<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Spin size="small" />
					</div>
				) : frameHtml ? (
					<iframe
						ref={iframeRef}
						key={`${pageUrl}-${reloadToken}`}
						title={getBrowserTitle(pageUrl)}
						srcDoc={frameHtml}
						sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							border: 0,
							background: '#fff',
						}}
					/>
				) : null}
			</div>
		</div>
	);
}
