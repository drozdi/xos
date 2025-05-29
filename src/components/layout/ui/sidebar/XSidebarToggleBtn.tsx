import { CloseButton } from '@mantine/core';
import './style.css';

import { useXSidebarContext } from './XSidebarContext';

export const XSidebarToggleBtn = () => {
	const ctx = useXSidebarContext();
	const isLeft = ctx?.type === 'left';
	const isOpen = ctx?.open || false;

	return (
		<CloseButton
			variant="default"
			color="grape"
			title={isOpen ? 'Развернуть' : 'Свернуть'}
			onClick={ctx?.toggle}
		/>
	);
};
