import { Button } from '@mantine/core';
import { TbSquareArrowLeft, TbSquareArrowRight } from 'react-icons/tb';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export const XSidebarMiniBtn = () => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isMini = ctx?.mini || false;
	return (
		<Button
			fullWidth
			variant="filled"
			radius={0}
			title={isMini ? 'Развернуть' : 'Свернуть'}
			onClick={ctx?.toggleMini}
		>
			{isMini && isLeft ? <TbSquareArrowRight /> : <TbSquareArrowLeft />}
		</Button>
	);
};
