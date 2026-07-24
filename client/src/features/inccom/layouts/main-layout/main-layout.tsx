import { Button, Flex, Layout } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { useIncComStandalone } from '@inccom/app/inccom-standalone';
import { PersonalLink } from '@inccom/features/lk/personal-link';
import { MainMenu } from '@inccom/features/menu/sidebar';
import { useBreakpoint } from '@inccom/shared/hooks';
import { $setting } from '@inccom/shared/setting';
import { Title } from '@inccom/shared/ui';

import { ThemeBtn } from './components/theme-btn';
import { Template } from './store';

const { Header, Sider, Content, Footer } = Layout;

export function MainLayout() {
	const navigate = useNavigate();
	const isStandalone = useIncComStandalone();
	const isMobile = useBreakpoint('sm');
	const back = useMemo<boolean>(() => {
		return (window?.history?.state?.idx ?? 0) > 0;
	}, []);
	const [mobileOpened, { toggle: toggleMobile }] = $setting.useDisclosure(
		'layout.mobile',
		false,
	);
	const [desktopOpened, { toggle: toggleDesktop }] = $setting.useDisclosure(
		'layout.desktop',
		true,
	);

	const siderCollapsed = isMobile ? !mobileOpened : !desktopOpened;

	return (
		<Layout style={{ height: '100%', minHeight: 0 }}>
			<Sider
				collapsible
				collapsed={siderCollapsed}
				trigger={null}
				width={280}
				collapsedWidth={64}
				style={{ overflow: 'auto' }}
			>
				{isMobile ? (
					<div style={{ padding: 8 }}>
						<Button type="text" onClick={toggleMobile} block>
							Меню
						</Button>
					</div>
				) : null}
				<MainMenu mini={!isMobile && siderCollapsed} />
			</Sider>
			<Layout>
				<Header
					style={{
						height: 52,
						lineHeight: '52px',
						paddingInline: 16,
						background: 'var(--ant-color-bg-container, #fff)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: '1px solid rgba(0,0,0,0.06)',
					}}
				>
					<Flex align="center" gap={12}>
						{isMobile ? (
							<Button type="text" onClick={toggleMobile}>
								☰
							</Button>
						) : (
							<Button
								type="text"
								onClick={toggleDesktop}
								icon={desktopOpened ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
							/>
						)}
						<Title order={1} level={4} fw={400}>
							<Template.Slot name="title" />
						</Title>
					</Flex>
					<Template.Slot name="header" />
					{isStandalone ? (
						<Flex align="center" gap={8}>
							<PersonalLink />
							<ThemeBtn />
						</Flex>
					) : (
						<span />
					)}
				</Header>
				<Content style={{ minHeight: 0, overflow: 'auto', padding: 16 }}>
					<div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
						<Outlet />
					</div>
				</Content>
				<Footer
					style={{
						height: 48,
						padding: '0 12px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Template.Slot name="footer">
						<div />
					</Template.Slot>
					<Button disabled={!back} onClick={() => navigate(-1)}>
						Назад
					</Button>
				</Footer>
			</Layout>
		</Layout>
	);
}
