import { AuthForm } from './components/auth-form';
import { Layout } from './components/layout';
import { StartMenu } from './components/start-menu';
import { WindowManager } from './components/window-manager';
import { useAuthSystem } from './core/auth-system';
function App() {
	// const [style, setStyle] = useState<{ left: number; top: number }>({
	// 	left: 0,
	// 	top: 0,
	// });
	// const dnd = useDraggable({
	// 	id: 'test',
	// });
	// const { setActivatorNodeRef, setNodeRef, listeners, attributes, transform } = dnd;
	// console.log({ ...dnd });

	// useEffect(() => {
	// 	setStyle((prev) => {
	// 		const nesStyle = { ...prev };
	// 		if (transform?.x) {
	// 			nesStyle.left = (dnd.activeNodeRect?.left || 0) + transform.x;
	// 		}
	// 		if (transform?.y) {
	// 			nesStyle.top = (dnd.activeNodeRect?.top || 0) + transform.y;
	// 		}
	// 		return nesStyle;
	// 	});
	// }, [transform]);
	// //activeNodeRect
	// return (
	// 	<div
	// 		{...attributes}
	// 		ref={setNodeRef}
	// 		style={{
	// 			...style,
	// 			position: 'absolute',
	// 			width: 300,
	// 			height: 300,
	// 			background: '#ff000088',
	// 		}}
	// 	>
	// 		<div
	// 			ref={setActivatorNodeRef}
	// 			{...listeners}
	// 			style={{
	// 				width: 100,
	// 				height: 100,
	// 				background: '#0000ff88',
	// 			}}
	// 		></div>
	// 	</div>
	// );

	const isAuth = useAuthSystem((state) => state.isAuth);
	return (
		<>
			{isAuth && (
				<Layout container toggle>
					<Layout.Header>
						<div>header</div>
					</Layout.Header>
					<Layout.Footer px={0} py={0} slot="footer">
						<>
							<StartMenu />
							<WindowManager />
						</>
					</Layout.Footer>
					<div>main</div>
				</Layout>
			)}
			<AuthForm />
		</>
	);
}

export default App;
