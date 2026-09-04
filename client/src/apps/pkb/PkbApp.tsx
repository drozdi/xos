import { Alert } from '@mantine/core';
import { useEffect, useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { asNonEmptyString, asPositiveInt } from '@/core/appManager/appLaunchProps';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { canUsePkb } from '@/features/pkb/pkbAccess';
import { loadLastVaultId, saveLastVaultId } from '@/features/pkb/hooks/usePkbUiPrefs';
import { VaultDashboardPage } from '@/features/pkb/VaultDashboardPage';

import { VaultWorkspacePage } from './pages/VaultWorkspacePage';

type PkbView = 'dashboard' | 'workspace';

export default function PkbApp() {
	useWindowTitle('База знаний');
	const { props } = useAppContext();
	const propVaultId = asPositiveInt(props?.vaultId);
	const propNotePath = asNonEmptyString(props?.notePath);

	const [view, setView] = useState<PkbView>('dashboard');
	const [activeVaultId, setActiveVaultId] = useState<number | null>(null);
	const [restoring, setRestoring] = useState(true);

	useEffect(() => {
		if (propVaultId) {
			setActiveVaultId(propVaultId);
			setView('workspace');
			setRestoring(false);
			void saveLastVaultId(propVaultId);
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const lastId = await loadLastVaultId();
				if (lastId !== null) {
					await pkbApi.vault(lastId);
					if (!cancelled) {
						setActiveVaultId(lastId);
						setView('workspace');
					}
				}
			} catch {
				// vault removed or inaccessible
			} finally {
				if (!cancelled) {
					setRestoring(false);
				}
			}
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
		setActiveVaultId(vaultId);
		setView('workspace');
		void saveLastVaultId(vaultId);
	};

	const handleBack = () => {
		setView('dashboard');
		setActiveVaultId(null);
	};

	if (restoring) {
		return null;
	}

	if (view === 'workspace' && activeVaultId !== null) {
		return (
			<VaultWorkspacePage
				vaultId={activeVaultId}
				initialNotePath={propVaultId === activeVaultId ? propNotePath : null}
				onBack={handleBack}
			/>
		);
	}

	return <VaultDashboardPage onOpenVault={handleOpenVault} />;
}
