import { Alert, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { asNonEmptyString, asPositiveInt } from '@/core/appManager/appLaunchProps';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import {
	clearLastVaultId,
	loadLastVaultId,
	saveLastVaultId,
} from '@/features/pkb/hooks/usePkbUiPrefs';
import { canUsePkb } from '@/features/pkb/pkbAccess';
import { VaultDashboardPage } from '@/features/pkb/VaultDashboardPage';

import { VaultWorkspacePage } from './pages/VaultWorkspacePage';

type PkbView = 'dashboard' | 'workspace';

async function resolveAccessibleVaultId(candidate: number | null): Promise<number | null> {
	if (candidate == null) {
		return null;
	}
	try {
		await pkbApi.vault(candidate);
		return candidate;
	} catch {
		await clearLastVaultId();
		return null;
	}
}

export default function PkbApp() {
	useWindowTitle('База знаний');
	const { props } = useAppContext();
	const propVaultId = asPositiveInt(props?.vaultId);
	const propNotePath = asNonEmptyString(props?.notePath);

	const [view, setView] = useState<PkbView>('dashboard');
	const [activeVaultId, setActiveVaultId] = useState<number | null>(null);
	const [restoring, setRestoring] = useState(true);
	const [staleVaultMessage, setStaleVaultMessage] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			setRestoring(true);
			setStaleVaultMessage(null);

			const preferred = propVaultId ?? (await loadLastVaultId());
			const resolved = await resolveAccessibleVaultId(preferred);

			if (cancelled) {
				return;
			}

			if (resolved != null) {
				setActiveVaultId(resolved);
				setView('workspace');
				void saveLastVaultId(resolved);
			} else {
				setActiveVaultId(null);
				setView('dashboard');
				if (preferred != null) {
					setStaleVaultMessage(
						`Vault #${preferred} недоступен (удалён или нет доступа). Выберите vault из списка.`,
					);
				}
			}

			setRestoring(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [propVaultId]);

	if (!canUsePkb()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет доступа к приложению «База знаний»
			</Alert>
		);
	}

	const handleOpenVault = (vaultId: number) => {
		setStaleVaultMessage(null);
		setActiveVaultId(vaultId);
		setView('workspace');
		void saveLastVaultId(vaultId);
	};

	const handleBack = () => {
		setView('dashboard');
		setActiveVaultId(null);
	};

	const handleVaultMissing = () => {
		void clearLastVaultId();
		setStaleVaultMessage('Vault больше не существует. Выберите другой из списка.');
		handleBack();
	};

	if (restoring) {
		return (
			<Stack align="center" justify="center" h="100%" gap="sm">
				<Loader size="sm" />
				<Text size="sm" c="dimmed">
					Загрузка…
				</Text>
			</Stack>
		);
	}

	if (view === 'workspace' && activeVaultId !== null) {
		return (
			<VaultWorkspacePage
				vaultId={activeVaultId}
				initialNotePath={propVaultId === activeVaultId ? propNotePath : null}
				onBack={handleBack}
				onVaultMissing={handleVaultMissing}
			/>
		);
	}

	return (
		<>
			{staleVaultMessage ? (
				<Alert color="yellow" title="Vault не найден" m="md" withCloseButton onClose={() => setStaleVaultMessage(null)}>
					{staleVaultMessage}
				</Alert>
			) : null}
			<VaultDashboardPage onOpenVault={handleOpenVault} />
		</>
	);
}
