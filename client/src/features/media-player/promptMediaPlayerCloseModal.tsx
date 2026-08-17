import { Button, Group, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

interface PromptMediaPlayerCloseModalOptions {
	onSave: () => void | Promise<void>;
	onDiscard: () => void | Promise<void>;
}

export function promptMediaPlayerCloseModal({
	onSave,
	onDiscard,
}: PromptMediaPlayerCloseModalOptions): void {
	const modalId = modals.open({
		title: 'Сохранить плейлист?',
		centered: true,
		children: (
			<Stack gap="md">
				<Text size="sm">В плейлисте есть несохранённые изменения.</Text>
				<Group justify="flex-end" gap="xs">
					<Button
						onClick={() => {
							modals.close(modalId);
							void onSave();
						}}
					>
						Сохранить
					</Button>
					<Button
						variant="default"
						onClick={() => {
							modals.close(modalId);
							void onDiscard();
						}}
					>
						Не сохранять
					</Button>
					<Button variant="default" onClick={() => modals.close(modalId)}>
						Отмена
					</Button>
				</Group>
			</Stack>
		),
	});
}
