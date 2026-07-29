export interface ApiAccountParticipant {
	id: number;
	name: string;
	email: string | null;
	login?: string | null;
}

export interface ApiAccount {
	id: number;
	label: string;
	name?: string;
	description?: string | null;
	currency?: string;
	type?: string;
	order?: number;
	color?: string;
	icon?: string;
	number?: string | null;
	balance?: string | number;
	masterId?: number;
	isMaster?: boolean;
	ownerId?: number;
	owner?: string | null;
	createdAt?: string;
	updatedAt?: string;
	participants?: ApiAccountParticipant[];
}
