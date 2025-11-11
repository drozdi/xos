import { createRoot, Root } from 'react-dom/client';
import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parameterize } from '../../utils/request';
import { App, IAppPorps } from './App';
import { AppProvider } from './context';

interface IConfig extends IAppPorps {
	component?: any;
	pathName?: string;
	wmGroup?: string;
	wmSort?: number;
}

type IAppConfig = {
	displayName: string;
	[key: string]: any;
};

type IInstance = Record<string, any> extends any ? any : { props?: { app: any } };

const getName = (appName: IAppConfig | string) => appName.displayName || appName;
const genPath = (conf: IConfig): string | undefined =>
	parameterize(conf.pathName || '', conf);
const get$App = (instance: IInstance | any) => instance.props?.app || instance;
const genId = (): string => `app-${uuid()}`;

export const useAppManager = create(
	persist(
		(set, get) => ({
			apps: {}, // Зарегистрированные приложения
			runs: {}, // Запущенные приложения
			history: [], // История запущенных приложений
			activeApp: null, // Активное приложение

			createRoot(): Root {
				const container = document.createElement('div');
				document.body.append(container);
				return createRoot(container);
			},
			mountRoot(app: IInstance): void {
				try {
					app = get$App(app);
					if (!app.root) {
						app.root = get().createRoot();
					}
					app.root.render(app.element);
				} catch (error) {
					console.error('Error mounting app:', error);
					throw error;
				}
			},
			unMountRoot(app: IInstance): void {
				try {
					const container = app.root?._internalRoot.containerInfo;
					app.root?.unmount();
					if (container) {
						container.remove();
					}
				} catch (error) {
					console.error('Error unmounting app:', error);
					throw error;
				}
			},
			get(appName: IAppConfig | string): any {
				const name = getName(appName);
				return get().apps[name];
			},
			// Метод регистрации приложения
			register(appName: IAppConfig | string, conf: IConfig = {}) {
				const name = getName(appName);
				set((state: Record<string, any>) => ({
					apps: { ...state.apps, [name]: conf },
				}));
			},

			constApp(conf: IAppPorps, pathName?: string): App {
				const $app = new App(conf);
				$app.pathName = pathName;

				$app.on('activated', () => {
					set({ activeApp: pathName });
				});

				$app.on('deactivated', () => {
					if (get().activeApp === pathName) {
						set({ activeApp: null });
					}
				});

				$app.on('close', () => {
					get().removeApp($app);
					get().unMountRoot($app);
				});

				return $app;
			},

			providerApp(
				Component: any,
				{ app, ...conf }: { app: App; [key: string]: any },
			) {
				return (app.element = (
					<AppProvider app={app}>
						<Component {...conf} />
					</AppProvider>
				));
			},

			buildApp(Component: any, _conf: IConfig = {}, mount: boolean = true) {
				try {
					const { apps, providerApp, constApp } = get();
					const appConfig = apps[getName(Component)] || {};
					const { pathName, ...conf } = { ...appConfig, ..._conf };

					const processedComponent = {
						component: Component,
						...appConfig,
					}.component;

					const generatedPath = genPath({ pathName, ...conf });

					if (!generatedPath) {
						return providerApp(processedComponent, {
							app: constApp(
								{
									smKey: _conf.smKey,
								},
								generatedPath,
							),
							...conf,
						});
					}

					if (!get().runs[generatedPath]) {
						const newApp = providerApp(processedComponent, {
							app: constApp({ smKey: _conf.smKey }, generatedPath),
							...conf,
						});

						set((state: Record<string, any>) => ({
							runs: { ...state.runs, [generatedPath]: newApp },
						}));

						mount && get().mountRoot(newApp);
					} else {
						get$App(get().runs[generatedPath])?.active();
					}

					return get().runs[generatedPath];
				} catch (error) {
					console.error('Error building app:', error);
					throw error;
				}
			},

			createApp(Component: any, conf: IConfig = {}, save: boolean = true) {
				try {
					conf.smKey = conf.smKey ?? genId();
					const $app = get$App(get().buildApp(Component, conf));
					if ($app.smKey === conf.smKey && save) {
						set((state: Record<string, any>) => ({
							history: [
								...state.history,
								{
									conf: conf,
									smKey: $app.smKey,
									appName: getName(Component),
								},
							],
						}));
					}
				} catch (error) {
					console.error('Error creating app:', error);
					throw error;
				}
			},
			removeApp($app) {
				try {
					$app = get$App($app);
					set((state) => ({
						history: state.history.filter(
							(appConfig: any) => appConfig.smKey != $app.smKey,
						),
						runs: {
							...state.runs,
							[$app.pathName]: undefined,
						},
					}));
				} catch (error) {
					console.error('Error removing app:', error);
					throw error;
				}
			},
			reloadApps() {
				try {
					get().history.forEach((appConfig: any) => {
						get().buildApp(appConfig.appName, appConfig.conf);
					});
				} catch (error) {
					console.error('Error reloading apps:', error);
					throw error;
				}
			},

			// Закрытие всех приложений
			closeAll() {
				try {
					Object.values(get().runs).forEach((app: any) => {
						app.close();
					});
					set({
						runs: {},
						history: [],
					});
				} catch (error) {
					console.error('Error closing all apps:', error);
					throw error;
				}
			},
			// Активация приложения
			activate(appName) {
				if (get().activeApp) {
					get().deactivate(get().activeApp);
				}
				get().activeApp = appName;
				console.log(`App ${appName} activated`);
			},

			deactivate(appName) {
				if (get().activeApp === appName) {
					get().activeApp = null;
					console.log(`App ${appName} deactivated`);
				}
			},
		}),
		{
			name: 'app-manager',
			partialize: (state: Record<string, any>) => ({
				history: state.history,
				activeApp: state.activeApp,
			}),
		},
	),
);
