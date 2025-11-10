import { Config } from './lib/Config';

export const config = new Config({
	access: 'read',
	newFolder: 'new folder',
	parentWindow: document.body,
});
