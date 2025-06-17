const loadAccc = async () => {
	return Promise.all([
		authAPI.getAccountMap().then(({ data }) => {
			for (let k in data) {
				scopes.joinScopes(k, data[k]);
			}
			return data;
		}),
		authAPI.getAccountRoles().then(({ data }) => {
			roles.joinRole(data || []);
			return data;
		}),
		authAPI.getAccountAccesses().then(({ data }) => {
			scopes.joinLevel(data || {});
			return data;
		}),
		authAPI.getAccountOptions().then(({ data }) => {
			//console.log(data)
			return data;
		}),
	]);
};
