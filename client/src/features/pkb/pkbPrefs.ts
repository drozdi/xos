import { z } from 'zod';

export const PKB_PREFS = {
	lastVaultId: 'pkb.ui.lastVaultId',
	sidebarWidth: 'pkb.ui.sidebarWidth',
} as const;

export const pkbLastVaultIdSchema = z.number().int().positive();

export const pkbSidebarWidthSchema = z.number().int().min(150).max(600);

export const DEFAULT_PKB_SIDEBAR_WIDTH = 250;
