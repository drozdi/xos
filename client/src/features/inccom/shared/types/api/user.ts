export interface ApiUser {
	id: number;
	login: string;
	email: string;
	name: string | null;
	roles?: string[];
}
