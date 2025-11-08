import { authAPI } from '../auth-system';
import { coreRoles } from '../roles-system';
import { coreScopes } from '../scopes-system';

export const loadAccc = async () => {
	return Promise.all([
		authAPI.getAccountMap().then((data) => {
			for (let k in data) {
				coreScopes.joinScopes(k, data[k]);
			}
			return data;
		}),
		authAPI.getAccountRoles().then((data) => {
			coreRoles.joinRole(data || []);
			return data;
		}),
		authAPI.getAccountAccesses().then((data) => {
			coreScopes.joinLevel(data || {});
			return data;
		}),
		authAPI.getAccountOptions().then((data) => {
			//console.log(data)
			return data;
		}),
	]);
};
