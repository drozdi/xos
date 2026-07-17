const hasOwn = {}.hasOwnProperty

type Arg = undefined | string | number | Record<string, any>
type Args = Arg | Arg[]
type Ret = string | number

function parseValue(arg: Args): Ret {
	if (typeof arg === 'string' || typeof arg === 'number') {
		return arg
	}
	if (typeof arg !== 'object') {
		return ''
	}
	if (Array.isArray(arg)) {
		return cls.apply(null, arg)
	}
	if (
		arg.toString !== Object.prototype.toString &&
		!arg.toString.toString().includes('[native code]')
	) {
		return arg.toString()
	}
	let classes = ''
	for (let key in arg) {
		if (hasOwn.call(arg, key) && arg[key]) {
			classes = appendClass(classes, key)
		}
	}
	return classes
}

function appendClass(val: string, newClass: string | number): string {
	if (!newClass) {
		return val
	}

	if (val) {
		return val + ' ' + newClass
	}

	return val + newClass
}

export function cls(...args: Arg[]): string {
	return args.reduce(
		(acc, arg): string => appendClass(acc as string, parseValue(arg)),
		''
	) as string
}
