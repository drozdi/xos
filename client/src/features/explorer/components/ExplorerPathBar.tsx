import { ActionIcon, Group, TextInput, Tooltip } from '@mantine/core';
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
		<Group
			gap="xs"
			px="sm"
			py={6}
			wrap="nowrap"
			component="form"
			onSubmit={handleSubmit}
			style={{
				flexShrink: 0,
				borderBottom: '1px solid var(--mantine-color-default-border)',
			}}
		>
			<Tooltip label="Назад">
				<ActionIcon variant="subtle" size="sm" disabled={!canGoBack} onClick={onBack}>
					<IconArrowLeft size={16} />
				</ActionIcon>
			</Tooltip>
			<Tooltip label="Вперёд">
				<ActionIcon variant="subtle" size="sm" disabled={!canGoForward} onClick={onForward}>
					<IconArrowRight size={16} />
				</ActionIcon>
			</Tooltip>
			<TextInput
				flex={1}
				size="xs"
				value={isTrashView ? `${path} (корзина)` : draft}
				onChange={(event) => setDraft(event.currentTarget.value)}
				onBlur={submit}
				readOnly={isTrashView}
				placeholder="disk://папка/"
				styles={{ input: { fontFamily: 'monospace' } }}
			/>
		</Group>
	);
}
