import { Alert } from '@mantine/core';
import { useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { BoardViewPage } from '@/features/board/BoardViewPage';
import { canUseBoard } from '@/features/board/boardAccess';
import { DashboardPage } from '@/features/board/DashboardPage';

type BoardView = 'dashboard' | 'board';

export default function BoardApp() {
	useWindowTitle('Доска');
	const [view, setView] = useState<BoardView>('dashboard');
	const [boardId, setBoardId] = useState<number | null>(null);

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
