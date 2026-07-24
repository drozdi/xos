import { Button, Dropdown, Flex, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { StartMenuPanel } from './startMenu/StartMenuPanel';
import {
	START_MENU_CONTEXT_ATTR,
	START_MENU_ROOT_ATTR,
} from './startMenu/useStartMenuItemMenu';

export function StartMenu() {
	const [opened, setOpened] = useState(false);

	useEffect(() => {
		if (!opened) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Element | null;
			if (!target) {
				return;
			}
			if (target.closest('[data-start-menu-target]')) {
				return;
			}
			if (target.closest(`[${START_MENU_ROOT_ATTR}]`)) {
				return;
			}
			if (target.closest(`[${START_MENU_CONTEXT_ATTR}]`)) {
				return;
			}
			if (target.closest('.ant-dropdown')) {
				return;
			}
			setOpened(false);
		};

		document.addEventListener('pointerdown', handlePointerDown, true);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown, true);
		};
	}, [opened]);

	return (
		<Dropdown
			open={opened}
			onOpenChange={setOpened}
			trigger={['click']}
			placement="topLeft"
			overlayStyle={{ zIndex: 2000, padding: 0 }}
			dropdownRender={() => (
				<div data-start-menu-root="" style={{ padding: 0 }}>
					<StartMenuPanel onClose={() => setOpened(false)} />
				</div>
			)}
			destroyOnHidden={false}
		>
			<Button
				data-start-menu-target=""
				type={opened ? 'primary' : 'text'}
				ghost={opened}
				size="middle"
				icon={
					<Typography.Text strong style={{ color: '#69b1ff', fontSize: 14 }}>
						X
					</Typography.Text>
				}
			>
				Пуск
			</Button>
		</Dropdown>
	);
}
