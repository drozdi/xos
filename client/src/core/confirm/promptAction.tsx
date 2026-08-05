import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useState } from 'react';

export interface PromptActionOptions {
	title: string;
	message?: string;
	defaultValue?: string;
	placeholder?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

interface PromptModalBodyProps extends PromptActionOptions {
	onSubmit: (value: string) => void;
	onCancel: () => void;
}

function PromptModalBody({
	message,
	defaultValue = '',
	placeholder,
	confirmLabel = 'OK',
	cancelLabel = 'Отмена',
	onSubmit,
	onCancel,
}: PromptModalBodyProps) {
	const [value, setValue] = useState(defaultValue);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				const trimmed = value.trim();
				if (!trimmed) {
					return;
				}
				onSubmit(trimmed);
			}}
		>
			<Stack gap="md">
				{message ? <Text size="sm">{message}</Text> : null}
				<TextInput
					data-autofocus
					value={value}
					placeholder={placeholder}
					onChange={(event) => setValue(event.currentTarget.value)}
				/>
				<Group justify="flex-end" gap="xs">
					<Button variant="default" type="button" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button type="submit" disabled={!value.trim()}>
						{confirmLabel}
					</Button>
				</Group>
			</Stack>
		</form>
	);
}

/** Mantine-диалог ввода строки (замена `window.prompt`). */
export function promptAction(options: PromptActionOptions): Promise<string | null> {
	return new Promise((resolve) => {
		const modalId = modals.open({
			title: options.title,
			centered: true,
			closeOnClickOutside: false,
			children: (
				<PromptModalBody
					{...options}
					onSubmit={(value) => {
						modals.close(modalId);
						resolve(value);
					}}
					onCancel={() => {
						modals.close(modalId);
						resolve(null);
					}}
				/>
			),
			onClose: () => resolve(null),
		});
	});
}
