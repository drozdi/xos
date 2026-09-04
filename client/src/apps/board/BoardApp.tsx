import { Alert } from '@mantine/core';
import { useEffect, useState } from 'react';

import { asPositiveInt } from '@/core/appManager/appLaunchProps';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
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

	useEffect(() => {
		if (propBoardId) {
			setBoardId(propBoardId);
			setView('board');
		}
	}, [propBoardId]);

	if (!canUseBoard()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет доступа к приложению «Доска»
			</Alert>
		);
	}

	if (view === 'board' && boardId !== null) {
		return (
			<BoardViewPage
				boardId={boardId}
				initialCardId={propBoardId === boardId ? propCardId : null}
				onBack={() => {
					setView('dashboard');
					setBoardId(null);
				}}
			/>
		);
	}

	return (
		<DashboardPage
			onOpenBoard={(id) => {
				setBoardId(id);
				setView('board');
			}}
		/>
	);
}
