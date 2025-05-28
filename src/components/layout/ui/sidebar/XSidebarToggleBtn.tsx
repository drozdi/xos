import { Button } from '@mantine/core';
import { IconSquareArrowLeft, IconSquareArrowRight } from '@tabler/icons-react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export const XSidebarToggleBtn = () => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isOpen = ctx?.open || false;

	return (
		<div className="x-sidebar-toggle">
			<Button
				fullWidth
				variant="default"
				color="grape"
				title={isOpen ? 'Развернуть' : 'Свернуть'}
				onClick={ctx?.toggle}
			>
				{isOpen && isLeft ? <IconSquareArrowLeft /> : <IconSquareArrowRight />}
			</Button>
		</div>
	);
};
