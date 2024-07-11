export function qualifyNumber (scope, number) {
	return scope ? `${ scope }.${ number }` : number;
}