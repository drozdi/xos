import { useStoreAuth, useStoreUserProfile } from '@inccom/entities/user';
import { Navigate } from 'react-router-dom';

export const SignOutPage = () => {
	const storeAuth = useStoreAuth();
	const storeUserProfile = useStoreUserProfile();
	storeAuth.logout();
	storeUserProfile.reset();
	return <Navigate to="/" />;
};
