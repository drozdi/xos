import {
	AppShell,
	Burger,
	Group,
	Skeleton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export function Layout() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      aside={{ width: 300, breakpoint: 'md', collapsed: { desktop: false, mobile: true } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        Navbar
        {Array(15)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} h={28} mt="sm" animate={false} />
          ))}
      </AppShell.Navbar>
      <AppShell.Main>
        Aside is hidden on on md breakpoint and cannot be opened when it is collapsed
      </AppShell.Main>
      <AppShell.Aside p="md">Aside</AppShell.Aside>
      <AppShell.Footer p="md">Footer</AppShell.Footer>
    </AppShell>
  );
}

/*
const parseLayout = (view) => {
  const [header, main, footer] = view.split(' ');
  return {
    header: header?.split('') || [],
    main: main?.split('') || [],
    footer: footer?.split('') || [],
  };
};

export const Layout = ({
	view = "hhh lmr fff",
	breakpoint = 768,
	overlay = false,
	children,
}) => {
	const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);
	const [navbarWidth, setNavbarWidth] = useState(250);
	const [asideWidth, setAsideWidth] = useState(300);
	const [navbarOpened, setNavbarOpened] = useState(false);
	const [asideOpened, setAsideOpened] = useState(false);

	const { header, main, footer } = parseLayout(view);
	
	const handleNavbarResize = (e, { size: { width } }) => {
		if (!isMobile) setNavbarWidth(width);
	};

	const handleAsideResize = (e, { size: { width } }) => {
		if (!isMobile) setAsideWidth(width);
	};

	const ResizableNavbar = ({ width, children }) => (
		<Resizable
		width={width}
		height={0}
		onResize={handleNavbarResize}
		resizeHandles={['e']}
		axis="x"
		disabled={isMobile}
		>
		<Box w={width} h="100%">
			{children}
		</Box>
		</Resizable>
	);
  
	const ResizableAside = ({ width, children }) => (
		<Resizable
		width={width}
		height={0}
		onResize={handleAsideResize}
		resizeHandles={['w']}
		axis="x"
		disabled={isMobile}
		>
		<Box w={width} h="100%">
			{children}
		</Box>
		</Resizable>
	)


	return (<AppShell
		header={{ height: header?.length ? 60 : 0 }}
		footer={{ height: footer?.length ? 60 : 0 }}
		navbar={{
			width: navbarWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !navbarOpened, desktop: !main.includes('l') }
		}}
		aside={{
			width: asideWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !asideOpened, desktop: !main.includes('r') }
		}}
		h="100%"
		w="100%"
	>
		{children}
	</AppShell>);
}*/