export interface IUser {
	id: number;
	login?: string;
	email: string;
	name?: string;
	alias: string;
	second_name: string;
	first_name: string;
	patronymic: string;
	description: string;
	date_register: string;
	last_login: string;
	x_timestamp: string;
	phone?: string;
	father_name?: string;
	password?: string;
}

export interface IRegisterRequest {
	login: string;
	email: string;
	password: string;
	name: string;
}

export interface IStoreBase {
	isLoading: boolean;
	error: string;
}

export interface IStoreAuth extends IStoreBase {
	isAuthenticated: boolean;
	isAuth: boolean;
	load(): Promise<void>;
	clearAuth(): void;
	login(username: string, password: string): Promise<boolean>;
	register(data: IRegisterRequest): Promise<{ user: IUser } | undefined>;
	logout(): Promise<void>;
}

export interface IStoreUserProfile extends IStoreBase {
	userData?: IUser;
	product_id?: string | number;
	setUserData(data: Partial<IUser>): void;
	load(reloading?: boolean): Promise<IUser | undefined>;
	update(userData: IUser): Promise<IUser | undefined>;
	updatePassword(oldPassword: string, newPassword: string): Promise<boolean>;
	delete(): Promise<unknown>;
	reset(): void;
}

declare global {
	interface IUser {
		id: number;
		login?: string;
		email: string;
		name?: string;
		alias: string;
		second_name: string;
		first_name: string;
		patronymic: string;
		description: string;
		date_register: string;
		last_login: string;
		x_timestamp: string;
		phone?: string;
		father_name?: string;
		password?: string;
	}

	interface IRegisterRequest {
		login: string;
		email: string;
		password: string;
		name: string;
	}

	interface IStoreBase {
		isLoading: boolean;
		error: string;
	}

	interface IStoreAuth extends IStoreBase {
		isAuthenticated: boolean;
		isAuth: boolean;
		load(): Promise<void>;
		clearAuth(): void;
		login(username: string, password: string): Promise<boolean>;
		register(data: IRegisterRequest): Promise<{ user: IUser } | undefined>;
		logout(): Promise<void>;
	}

	interface IStoreUserProfile extends IStoreBase {
		userData?: IUser;
		product_id?: string | number;
		setUserData(data: Partial<IUser>): void;
		load(reloading?: boolean): Promise<IUser | undefined>;
		update(userData: IUser): Promise<IUser | undefined>;
		updatePassword(oldPassword: string, newPassword: string): Promise<boolean>;
		delete(): Promise<unknown>;
		reset(): void;
	}
}

export {};
