import { optionsAPI } from './api';

interface ICoreOptions {
	load(): void;
}

const coreOptions: ICoreOptions = {
	async load() {
		return optionsAPI.getOptions().then(({ data }) => {
			return data;
		});
	},
};

export default coreOptions;
