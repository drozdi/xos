import { Button, Group } from '@mantine/core';
import { memo, useMemo } from 'react';
import { useWmStore } from '../../core/window-system/store';

export const WindowManager = memo(() => {
	const { isActive, _stack } = useWmStore((state: Record<string, any>) => ({
		isActive: state.isActive,
		_stack: { ...state.stack },
	}));
	const stack = useMemo<any[]>(() => Object.values(_stack), [_stack]);
	return (
		<Group gap={0}>
			{stack.map((win) => (
				<Button
					variant={isActive(win) ? 'light' : 'subtle'}
					radius={0}
					size="lg"
					color="gray"
					key={win.uid}
					onClick={win.focus}
				>
					{win.title}
				</Button>
			))}
		</Group>
	);
});
