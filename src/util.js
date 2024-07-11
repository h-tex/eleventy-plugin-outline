export function qualifyNumber (scope, number) {
	return scope ? `${ scope }.${ number }` : number;
}

export function getIdRegex (idFormat) {
	return matchAttribute("id", idFormat);
}

export function matchAttribute (name, value = ".+?") {
	return re`\\b${ name }=(?<q>["']?)(${ value })(?=\\k<q>|\\s|>|$)\\k<q>`;
}

/**
 * Returns a regular expression that matches an element with the specified attribute.
 * Caveat: element cannot have another element of the same type nested within (yes, you shouldn't parse HTML with regexes)
 * @param {RegExp | string} name
 * @param {RegExp | string} value
 * @param {*} options
 * @returns
 */
export function matchElementByAttribute (name, value, {tag} = {}) {
	let attr = matchAttribute(name, value);

	return matchElementByType(tag, {attrs: re`[^>]*${ attr }[^>]*`});
}

export function matchElementByType (tag = "(\\w+:)?[\\w-]+", {attrs = "[^>]*"} = {}) {
	return re`<(?<tag>${tag})\\b(?<attrs>${attrs})>(?<content>[\\S\\s]*?)</\\k<tag>>`;
}

export function re (strings, ...values) {
	let flags = "gi";
	let pattern = strings.reduce((acc, str, i) => {
		let value = values[i] ?? "";

		if (value instanceof RegExp) {
			flags += value.flags;
			value = value.source;
		}
		return acc + str + value;
	}, "");

	flags = [...new Set(flags)].join("");
	return new RegExp(pattern, flags);
}