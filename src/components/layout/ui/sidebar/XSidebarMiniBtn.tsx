import { Button } from '@mantine/core';
import { IconSquareArrowLeft, IconSquareArrowRight } from '@tabler/icons-react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export const XSidebarMiniBtn = () => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;
	return (
		<div className="x-sidebar-toggle-mini">
			<Button
				fullWidth
				variant="default"
				title={isMini ? 'Развернуть' : 'Свернуть'}
				onClick={ctx?.toggleMini}
			>
				{isMini && isLeft ? <IconSquareArrowRight /> : <IconSquareArrowLeft />}
			</Button>
		</div>
	);
};
