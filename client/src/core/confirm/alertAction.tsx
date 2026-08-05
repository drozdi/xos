import { Button, Group, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

export interface AlertActionOptions {
	title: string;
	message: string;
	confirmLabel?: string;
}

/** Mantine-диалог уведомления (замена `window.alert`). */
export function alertAction(options: AlertActionOptions): Promise<void> {
	return new Promise((resolve) => {
		const modalId = modals.open({
			title: options.title,
			centered: true,
			children: (
				<Stack gap="md">
					<Text size="sm">{options.message}</Text>
					<Group justify="flex-end">
						<Button
							onClick={() => {
								modals.close(modalId);
								resolve();
							}}
						>
							{options.confirmLabel ?? 'OK'}
						</Button>
					</Group>
				</Stack>
			),
			onClose: () => resolve(),
		});
	});
}
