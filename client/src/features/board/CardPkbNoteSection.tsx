import { Button, Checkbox, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { type BoardMember, type CardDetail, boardApi } from '@/core/api/endpoints/boardApi';
import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAppManager } from '@/core/appManager/useAppManager';
import { canUsePkb } from '@/features/pkb/pkbAccess';

interface CardPkbNoteSectionProps {
	card: CardDetail;
	boardId: number;
	members: BoardMember[];
	canEdit: boolean;
	onUpdated: () => void;
}

export function CardPkbNoteSection({
	card,
	boardId,
	members,
	canEdit,
	onUpdated,
}: CardPkbNoteSectionProps) {
	const launchApp = useAppManager((state) => state.launchApp);
	const pkbEnabled = canUsePkb();
	const linked = Boolean(card.pkb_vault_id && card.pkb_note_path);

	const [vaultId, setVaultId] = useState<string | null>(
		card.pkb_vault_id != null ? String(card.pkb_vault_id) : null,
	);
	const [notePath, setNotePath] = useState<string | null>(card.pkb_note_path ?? null);
	const [shareWithBoard, setShareWithBoard] = useState(true);

	const vaultsQuery = useQuery({
		queryKey: queryKeys.pkb.vaults,
		queryFn: () => pkbApi.vaults(),
		enabled: pkbEnabled && canEdit && !linked,
	});

	const selectedVaultId = vaultId ? Number(vaultId) : null;

	const notesQuery = useQuery({
		queryKey: queryKeys.pkb.notes(selectedVaultId ?? 0),
		queryFn: () => pkbApi.notes(selectedVaultId!),
		enabled: pkbEnabled && canEdit && !linked && selectedVaultId != null,
	});

	const vaultOptions = useMemo(
		() =>
			(vaultsQuery.data ?? [])
				.filter((vault) => vault.permissions?.can_read_files !== false)
				.map((vault) => ({ value: String(vault.id), label: vault.name })),
		[vaultsQuery.data],
	);

	const noteOptions = useMemo(
		() =>
			(notesQuery.data?.notes ?? []).map((note) => ({
				value: note.path,
				label: note.title || note.path,
			})),
		[notesQuery.data],
	);

	const inviteBoardMembers = async (targetVaultId: number) => {
		if (!shareWithBoard) {
			return;
		}
		try {
			const vault = await pkbApi.vault(targetVaultId);
			if (!vault.permissions?.can_manage_members) {
				return;
			}
			const vaultMembers = await pkbApi.listVaultMembers(targetVaultId);
			const existingIds = new Set(
				vaultMembers.map((m) => m.user_id).filter((id): id is number => id != null),
			);
			const existingEmails = new Set(
				vaultMembers
					.map((m) => m.email?.trim().toLowerCase())
					.filter((email): email is string => Boolean(email)),
			);
			for (const member of members) {
				const userId = member.user_id ?? null;
				const email = member.email?.trim() ?? '';
				if (userId != null && existingIds.has(userId)) {
					continue;
				}
				if (email && existingEmails.has(email.toLowerCase())) {
					continue;
				}
				try {
					if (userId != null) {
						await pkbApi.inviteVaultMember(targetVaultId, { userId, role: 'reader' });
					} else if (email) {
						await pkbApi.inviteVaultMember(targetVaultId, { email, role: 'reader' });
					}
				} catch {
					// bind succeeds even if invite fails
				}
			}
		} catch {
			// bind succeeds even if invite fails
		}
	};

	const bindMutation = useMutation({
		mutationFn: async (payload: { vaultId: number; path: string; create?: boolean }) => {
			if (payload.create) {
				await pkbApi.putFileContent(payload.vaultId, payload.path, `# ${card.title}\n`);
			}
			await boardApi.updateCard(card.id, {
				pkb_vault_id: payload.vaultId,
				pkb_note_path: payload.path,
			});
			await inviteBoardMembers(payload.vaultId);
		},
		onSuccess: () => {
			notifications.show({ color: 'green', message: 'Заметка привязана' });
			onUpdated();
		},
		onError: (error) => notifyApiError(error, 'Не удалось привязать заметку'),
	});

	const unlinkMutation = useMutation({
		mutationFn: () =>
			boardApi.updateCard(card.id, { pkb_vault_id: null, pkb_note_path: null }),
		onSuccess: () => {
			setVaultId(null);
			setNotePath(null);
			onUpdated();
		},
		onError: (error) => notifyApiError(error, 'Не удалось отвязать заметку'),
	});

	const openInPkb = () => {
		if (!card.pkb_vault_id || !card.pkb_note_path) {
			return;
		}
		void launchApp('pkb', {
			props: { vaultId: card.pkb_vault_id, notePath: card.pkb_note_path },
		});
	};

	if (!pkbEnabled && !linked) {
		return null;
	}

	return (
		<Stack gap="xs">
			<Text size="sm" fw={500}>
				Заметка
			</Text>
			{linked ? (
				<>
					<Text size="sm" c="dimmed" lineClamp={2}>
						{card.pkb_note_path}
					</Text>
					<Group gap="xs">
						<Button size="xs" variant="light" onClick={openInPkb} disabled={!pkbEnabled}>
							Открыть в базе знаний
						</Button>
						{canEdit ? (
							<Button
								size="xs"
								variant="subtle"
								color="red"
								loading={unlinkMutation.isPending}
								onClick={() => unlinkMutation.mutate()}
							>
								Отвязать
							</Button>
						) : null}
					</Group>
				</>
			) : canEdit ? (
				<>
					<Select
						size="xs"
						label="Vault"
						placeholder="Выберите vault"
						searchable
						data={vaultOptions}
						value={vaultId}
						onChange={(value) => {
							setVaultId(value);
							setNotePath(null);
						}}
					/>
					<Select
						size="xs"
						label="Заметка"
						placeholder="Существующая заметка"
						searchable
						disabled={!vaultId}
						data={noteOptions}
						value={notePath}
						onChange={setNotePath}
					/>
					<Checkbox
						size="xs"
						label="Выдать доступ участникам доски"
						checked={shareWithBoard}
						onChange={(e) => setShareWithBoard(e.currentTarget.checked)}
					/>
					<Group gap="xs">
						<Button
							size="xs"
							disabled={!vaultId || !notePath}
							loading={bindMutation.isPending}
							onClick={() =>
								bindMutation.mutate({
									vaultId: Number(vaultId),
									path: notePath!,
								})
							}
						>
							Привязать
						</Button>
						<Button
							size="xs"
							variant="light"
							disabled={!vaultId}
							loading={bindMutation.isPending}
							onClick={() =>
								bindMutation.mutate({
									vaultId: Number(vaultId),
									path: `Board/${boardId}/${card.id}.md`,
									create: true,
								})
							}
						>
							Создать
						</Button>
					</Group>
				</>
			) : (
				<Text size="sm" c="dimmed">
					Не привязана
				</Text>
			)}
		</Stack>
	);
}
