export function qualifyNumber (scope, number) {
	return scope ? `${ scope }.${ number }` : number;
}

export function getIdRegex ({idFormat, flags = "gi"} = {}) {
	return RegExp(`\\bid=(["']?)(${ idFormat?.source ?? ".+?"})(?=\\1|$|>|\\s)\\1`, flags);
}
