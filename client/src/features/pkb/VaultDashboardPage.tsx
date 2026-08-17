import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Card,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolderOpen, IconPlus, IconTrash, IconUsers } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';

import { CreateVaultModal } from './CreateVaultModal';
import { ShareVaultModal } from './ShareVaultModal';

interface VaultDashboardPageProps {
	onOpenVault: (vaultId: number) => void;
}

export function VaultDashboardPage({ onOpenVault }: VaultDashboardPageProps) {
	const queryClient = useQueryClient();
	const [createOpened, setCreateOpened] = useState(false);
	const [shareVaultId, setShareVaultId] = useState<number | null>(null);

	const vaultsQuery = useQuery({
		queryKey: queryKeys.pkb.vaults,
		queryFn: () => pkbApi.vaults(),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => pkbApi.removeVault(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vaults });
			notifications.show({ color: 'green', message: 'Vault удалён' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить vault' });
		},
	});

	const confirmDelete = (vaultId: number, name: string) => {
		confirmAction({
			title: 'Удалить vault?',
			message: `«${name}» будет удалён из списка. Файлы на диске сохранятся.`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => deleteMutation.mutate(vaultId),
		});
	};

	if (vaultsQuery.isLoading) {
		return (
			<Group justify="center" py="xl">
				<Loader />
			</Group>
		);
	}

	if (vaultsQuery.isError) {
		return (
			<Alert color="red" title="Ошибка" m="md">
				Не удалось загрузить список vault
			</Alert>
		);
	}

	const vaults = vaultsQuery.data ?? [];
	const shareVault = vaults.find((vault) => vault.id === shareVaultId);

	return (
		<Stack gap="md" p="md" h="100%">
			<Group justify="space-between">
				<Text size="lg" fw={600}>
					Vaults
				</Text>
				<Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpened(true)}>
					Создать vault
				</Button>
			</Group>

			{vaults.length === 0 ? (
				<Stack align="center" justify="center" flex={1} gap="sm">
					<Text c="dimmed">Нет vault. Создайте первый.</Text>
					<Button variant="light" onClick={() => setCreateOpened(true)}>
						Создать vault
					</Button>
				</Stack>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					{vaults.map((vault) => (
						<Card key={vault.id} withBorder padding="md" radius="md">
							<Stack gap="xs">
								<Group gap="xs" wrap="nowrap">
									<Text fw={600} lineClamp={1} flex={1}>
										{vault.name}
									</Text>
									{!vault.is_owner ? (
										<Badge size="xs" variant="light" color="blue">
											Общий
										</Badge>
									) : null}
								</Group>
								<Text size="xs" c="dimmed">
									{vault.slug}
								</Text>
								<Group justify="space-between" mt="xs">
									<Button
										size="xs"
										variant="light"
										leftSection={<IconFolderOpen size={14} />}
										onClick={() => onOpenVault(vault.id)}
									>
										Открыть
									</Button>
									<Group gap="xs">
										{vault.permissions?.can_manage_members ? (
											<ActionIcon
												variant="subtle"
												onClick={() => setShareVaultId(vault.id)}
												aria-label="Поделиться vault"
											>
												<IconUsers size={16} />
											</ActionIcon>
										) : null}
										{vault.permissions?.can_delete ? (
											<ActionIcon
												variant="subtle"
												color="red"
												onClick={() => confirmDelete(vault.id, vault.name)}
												aria-label="Удалить vault"
											>
												<IconTrash size={16} />
											</ActionIcon>
										) : null}
									</Group>
								</Group>
							</Stack>
						</Card>
					))}
				</SimpleGrid>
			)}

			<CreateVaultModal
				opened={createOpened}
				onClose={() => setCreateOpened(false)}
				onCreated={onOpenVault}
			/>

			{shareVault ? (
				<ShareVaultModal
					vaultId={shareVault.id}
					opened={shareVaultId !== null}
					canManageMembers={shareVault.permissions?.can_manage_members ?? false}
					onClose={() => setShareVaultId(null)}
				/>
			) : null}
		</Stack>
	);
}
