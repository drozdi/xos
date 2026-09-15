import { Alert, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

import { asPositiveInt } from '@/core/appManager/appLaunchProps';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { BoardGlobalSearch } from '@/features/board/BoardGlobalSearch';
import { BoardViewPage } from '@/features/board/BoardViewPage';
import { canUseBoard } from '@/features/board/boardAccess';
import { DashboardPage } from '@/features/board/DashboardPage';

type BoardView = 'dashboard' | 'board';

export default function BoardApp() {
	useWindowTitle('Доска');
	const { props } = useAppContext();
	const propBoardId = asPositiveInt(props?.boardId);
	const propCardId = asPositiveInt(props?.cardId);

	const [view, setView] = useState<BoardView>('dashboard');
	const [boardId, setBoardId] = useState<number | null>(null);
	const [openCardId, setOpenCardId] = useState<number | null>(null);

	useEffect(() => {
		if (propBoardId) {
			setBoardId(propBoardId);
			setView('board');
			setOpenCardId(propCardId);
		}
	}, [propBoardId, propCardId]);

	const openBoard = (id: number, cardId?: number | null) => {
		setBoardId(id);
		setView('board');
		// reset then set so reopening the same card from search still opens the modal
		setOpenCardId(null);
		if (cardId != null) {
			queueMicrotask(() => setOpenCardId(cardId));
		}
	};

	if (!canUseBoard()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет доступа к приложению «Доска»
			</Alert>
		);
	}

	return (
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<Group px="md" pt="sm" pb="xs" gap="sm" wrap="nowrap">
				<BoardGlobalSearch
					onOpenCard={(id, cardId) => {
						openBoard(id, cardId);
					}}
				/>
			</Group>
			{view === 'board' && boardId !== null ? (
				<BoardViewPage
					boardId={boardId}
					initialCardId={openCardId}
					onBack={() => {
						setView('dashboard');
						setBoardId(null);
						setOpenCardId(null);
					}}
				/>
			) : (
				<DashboardPage onOpenBoard={(id) => openBoard(id)} />
			)}
		</Stack>
	);
}
