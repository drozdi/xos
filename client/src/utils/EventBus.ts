export class EventBus {
	constructor(events = {}) {
		this.__stack = {};
		Object.entries(events).forEach(([key, handler]) => {
			this.__stack[key] = this.__stack[key] || [];
			this.__stack[key]?.push({
				fn: handler,
				ctx: undefined,
			});
		});
	}
	on(key, handler, ctx) {
		this.__stack[key] = this.__stack[key] || [];
		this.__stack[key]?.push({
			fn: handler,
			ctx,
		});
		return () => {
			this.off(key, handler);
		};
	}
	once(key, handler, ctx) {
		const handleOnce = (...args) => {
			this.off(key, handleOnce);
			handler.apply(ctx, ...args);
		};
		this.on(key, handleOnce, ctx);
	}
	off(key, handler) {
		const list = this.__stack[key];
		if (list === void 0) {
			return;
		}
		if (handler === void 0) {
			delete this.__stack[key];
		}

		const liveEvents = list.filter((entry) => entry.fn !== handler);

		if (liveEvents.length !== 0) {
			this.__stack[key] = liveEvents;
		} else {
			delete this.__stack[key];
		}
	}

	emit(key, ...args) {
		const list = this.__stack[key];

		if (list !== void 0) {
			list.forEach((entry) => {
				entry.fn.apply(entry.ctx ?? this, args);
			});
		}
	}
}
