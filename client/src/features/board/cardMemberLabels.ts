import type { BoardMember } from '@/core/api/endpoints/boardApi';

export function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

export function userRefLabel(user: {
	id?: number | null;
	alias?: string | null;
	email?: string | null;
}): string {
	return user.alias?.trim() || user.email?.trim() || (user.id != null ? `User #${user.id}` : 'User');
}

export function memberInitials(member: BoardMember): string {
	const label = memberLabel(member);
	const parts = label.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		const a = parts[0]?.[0] ?? '';
		const b = parts[1]?.[0] ?? '';
		return (a + b).toUpperCase() || '?';
	}
	return label.slice(0, 2).toUpperCase() || '?';
}
