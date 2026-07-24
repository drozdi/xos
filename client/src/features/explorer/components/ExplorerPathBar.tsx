import { Button, Flex, Input, Tooltip } from 'antd';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useEffect, useState, type FormEvent } from 'react';

function normalizeExplorerPath(input: string): string {
	const trimmed = input.trim();
	const match = /^([a-z0-9_-]+):\/\/(.*)$/i.exec(trimmed);
	if (!match) {
		return trimmed;
	}
	const disk = (match[1] ?? 'home').toLowerCase();
	const rest = match[2]?.replace(/\/+$/, '') ?? '';
	return rest ? `${disk}://${rest}/` : `${disk}://`;
}

interface ExplorerPathBarProps {
	path: string;
	isTrashView?: boolean;
	canGoBack?: boolean;
	canGoForward?: boolean;
	onBack?: () => void;
	onForward?: () => void;
	onNavigate: (path: string) => void;
}

export function ExplorerPathBar({
	path,
	isTrashView = false,
	canGoBack = false,
	canGoForward = false,
	onBack,
	onForward,
	onNavigate,
}: ExplorerPathBarProps) {
	const [draft, setDraft] = useState(path);

	useEffect(() => {
		setDraft(isTrashView ? path : path);
	}, [path, isTrashView]);

	const submit = () => {
		if (isTrashView) {
			return;
		}
		const normalized = normalizeExplorerPath(draft);
		if (!/^([a-z0-9_-]+):\/\//i.test(normalized)) {
			setDraft(path);
			return;
		}
		onNavigate(normalized);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		submit();
	};

	return (
		<form onSubmit={handleSubmit}>
			<Flex
				gap="small"
				wrap="nowrap"
				align="center"
				style={{
					padding: '6px 12px',
					flexShrink: 0,
					borderBottom: '1px solid var(--xos-shell-border)',
				}}
			>
				<Tooltip title="Назад">
					<Button
						type="text"
						size="small"
						disabled={!canGoBack}
						onClick={onBack}
						icon={<IconArrowLeft size={16} />}
					/>
				</Tooltip>
				<Tooltip title="Вперёд">
					<Button
						type="text"
						size="small"
						disabled={!canGoForward}
						onClick={onForward}
						icon={<IconArrowRight size={16} />}
					/>
				</Tooltip>
				<Input
					size="small"
					value={isTrashView ? `${path} (корзина)` : draft}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={submit}
					readOnly={isTrashView}
					placeholder="disk://папка/"
					style={{ flex: 1, fontFamily: 'monospace' }}
				/>
			</Flex>
		</form>
	);
}
