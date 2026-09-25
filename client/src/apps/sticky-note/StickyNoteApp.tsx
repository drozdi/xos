import { Box, Group, Textarea, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import {
	STICKY_COLORS,
	loadStickyNote,
	saveStickyNote,
	type StickyColor,
} from './stickyStorage';

export default function StickyNoteApp() {
	useWindowTitle('Стикер');
	const { instanceKey } = useAppContext();
	const [ready, setReady] = useState(false);
	const [text, setText] = useState('');
	const [color, setColor] = useState<StickyColor>(STICKY_COLORS[0]);

	useEffect(() => {
		const data = loadStickyNote(instanceKey);
		setText(data.text);
		setColor(data.color);
		setReady(true);
	}, [instanceKey]);

	useEffect(() => {
		if (!ready) {
			return;
		}
		saveStickyNote(instanceKey, { text, color });
	}, [instanceKey, text, color, ready]);

	return (
		<Box
			h="100%"
			style={{
				display: 'flex',
				flexDirection: 'column',
				background: color,
				minHeight: 0,
			}}
		>
			<Group gap={6} p={8} style={{ flexShrink: 0 }}>
				{STICKY_COLORS.map((c) => (
					<UnstyledButton
						key={c}
						aria-label={`Цвет ${c}`}
						onClick={() => setColor(c)}
						style={{
							width: 18,
							height: 18,
							borderRadius: '50%',
							background: c,
							border:
								c === color
									? '2px solid var(--mantine-color-dark-6)'
									: '1px solid rgba(0,0,0,0.2)',
						}}
					/>
				))}
			</Group>
			<Textarea
				value={text}
				onChange={(e) => setText(e.currentTarget.value)}
				placeholder="Заметка…"
				autosize={false}
				styles={{
					root: { flex: 1, minHeight: 0, display: 0 },
					wrapper: { height: '100%' },
					input: {
						height: '100%',
						border: 'none',
						background: 'transparent',
						resize: 'none',
						fontSize: 14,
						lineHeight: 1.4,
					},
				}}
			/>
		</Box>
	);
}
