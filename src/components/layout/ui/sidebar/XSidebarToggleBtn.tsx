import { Button } from '@mantine/core';
import { IconSquareArrowLeft, IconSquareArrowRight } from '@tabler/icons-react';
import { memo } from 'react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

import { ButtonProps } from '@mantine/core';

export const XSidebarToggleBtn = memo((props: ButtonProps) => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isOpen = ctx?.open || false;

	return (
		<div className="x-sidebar-toggle">
			<Button
				{...props}
				fullWidth
				variant="default"
				color="grape"
				title={isOpen ? 'Развернуть' : 'Свернуть'}
			>
				{isOpen && isLeft ? <IconSquareArrowLeft /> : <IconSquareArrowRight />}
			</Button>
		</div>
	);
});
