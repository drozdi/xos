import { Button } from '@mantine/core';
import { IconSquareArrowLeft, IconSquareArrowRight } from '@tabler/icons-react';
import { memo } from 'react';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

import { ButtonProps } from '@mantine/core';

export const XSidebarMiniBtn = memo((props: ButtonProps) => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;

	return (
		<div className="x-sidebar-toggle-mini">
			<Button
				{...props}
				fullWidth
				variant="default"
				title={isMini ? 'Развернуть' : 'Свернуть'}
			>
				{isMini && isLeft ? <IconSquareArrowRight /> : <IconSquareArrowLeft />}
			</Button>
		</div>
	);
});
