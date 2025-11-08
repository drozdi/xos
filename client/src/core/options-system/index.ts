import { optionsAPI } from './api';

interface ICoreOptions {
	load(): void;
}

export const coreOptions: ICoreOptions = {
	async load() {
		return await optionsAPI.getOptions();
	},
};
