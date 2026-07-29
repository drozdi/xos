import { ProtectedRoute } from '@inccom/features/auth/protected-route';
import {
	AccountCreatePage,
	AccountDetailPage,
	AccountsListPage,
} from '@inccom/pages/accounts';
import { SignInPage } from '@inccom/pages/auth/sign-in-page';
import { SignOutPage } from '@inccom/pages/auth/sign-out-page';
import { SignUpPage } from '@inccom/pages/auth/sign-up-page';
import { CategoriesAccountPage } from '@inccom/pages/categories/categories-account-page';
import { CategoriesPage } from '@inccom/pages/categories/categories-page';
import { ItemCategoriesPage } from '@inccom/pages/item-categories';
import { ItemFormPage, ItemsListPage } from '@inccom/pages/items';
import {
	LegacyTransactionCreateRedirect,
	LegacyTransferCreateRedirect,
	TransactionCreatePage,
	TransactionEditPage,
	TransactionsListPage,
	TransferCreatePage,
	TransferEditPage,
} from '@inccom/pages/transactions';
import { AuthLayout, MainLayout } from '@inccom/layouts';
import { Navigate, Outlet, useParams, useRoutes } from 'react-router-dom';

function LegacyAccountRedirect() {
	const { id } = useParams();
	return <Navigate to={`/accounts/${id}`} replace />;
}

export function AppRouters() {
	return useRoutes([
		{
			path: '/auth',
			element: <AuthLayout />,
			children: [
				{ path: 'sign-in', element: <SignInPage /> },
				{ path: 'sign-up', element: <SignUpPage /> },
				{ path: 'sign-out', element: <SignOutPage /> },
			],
		},
		{
			path: '/',
			element: (
				<ProtectedRoute>
					<MainLayout />
				</ProtectedRoute>
			),
			children: [
				{ path: '', element: <Navigate to="/accounts" replace /> },
				{
					path: 'accounts',
					element: <Outlet />,
					children: [
						{ path: '', element: <AccountsListPage /> },
						{ path: 'new', element: <AccountCreatePage /> },
						{ path: ':id', element: <AccountDetailPage /> },
						{
							path: ':id/transactions',
							element: <Outlet />,
							children: [
								{ path: '', element: <TransactionsListPage /> },
								{ path: 'new', element: <LegacyTransactionCreateRedirect /> },
							],
						},
						{ path: ':id/transfers/new', element: <LegacyTransferCreateRedirect /> },
						{ path: ':id/categories', element: <CategoriesPage /> },
					],
				},
				{
					path: 'transactions',
					element: <Outlet />,
					children: [
						{ path: '', element: <TransactionsListPage /> },
						{ path: 'new', element: <TransactionCreatePage /> },
						{ path: ':id/edit', element: <TransactionEditPage /> },
					],
				},
				{
					path: 'transfers',
					element: <Outlet />,
					children: [
						{ path: 'new', element: <TransferCreatePage /> },
						{ path: ':id/edit', element: <TransferEditPage /> },
					],
				},
				{
					path: 'items',
					element: <Outlet />,
					children: [
						{ path: '', element: <ItemsListPage /> },
						{ path: 'new', element: <ItemFormPage /> },
						{ path: ':id', element: <ItemFormPage /> },
					],
				},
				{ path: 'item-categories', element: <ItemCategoriesPage /> },
				{
					path: 'categories',
					element: <Outlet />,
					children: [
						{ path: '', element: <CategoriesAccountPage /> },
						{ path: ':id', element: <CategoriesPage /> },
					],
				},
				{ path: 'account', element: <Navigate to="/accounts" replace /> },
				{ path: 'account/new', element: <Navigate to="/accounts/new" replace /> },
				{ path: 'account/:id', element: <LegacyAccountRedirect /> },
			],
		},
		{ path: '*', element: <Navigate to="/" replace /> },
	]);
}
