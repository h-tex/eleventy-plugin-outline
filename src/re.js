/**
 * Template tag function that composes a RegExp object from a template string and smaller regexes.
 * @param {*} strings
 * @param  {...any} values
 * @returns
 */
export default function re (strings, ...values) {
	let flags = "gisu";
	let pattern = strings.reduce((acc, str, i) => {
		acc += str;
		let value = values[i] ?? "";

		if (value instanceof RegExp) {
			flags += value.flags;
			value = value.source;
		}

		// Prevent "Duplicate capture group name" error
		for (let match of value.matchAll(/(?<=\(\?\<).+?(?=\>)/g)) {
			let group = match[0];
			let newGroup = group;

			while (acc.includes(`(?<${ newGroup }>`)) {
				newGroup = newGroup.at(-1) > 0 ? newGroup.replace(/\d+$/, match => Number(match) + 1) : newGroup + "_2";
			}

			if (newGroup !== group) {
				value = value.replaceAll(`(?<${ group }>`, `(?<${ newGroup }>`)
				             .replaceAll(`\\k<${ group }>`, `\\k<${ newGroup }>`);
			}
		}

		return acc + value;
	}, "");

	// Deduplicate flags, or RegExp() will error
	flags = [...new Set(flags)].join("");

	return new RegExp(pattern, flags);
}

// Convert deduplicated group names like foo_2 back to foo
export function processGroups (groups) {
	if (!groups) {
		return {};
	}

	let ret = {};

	for (let name in groups) {
		let value = groups[name];
		name = name.replace(/_\d+$/, "");

		if (value !== undefined) {
			if (ret[name] === undefined) {
				ret[name] = value;
			}
			else {
				ret[name] = Array.isArray(ret[name]) ? ret[name] : [ret[name]];
				ret[name].push(value);
			}
		}
	}

	return ret;
}

export function parseAll (regex, str) {
	if (str instanceof RegExp && typeof regex === "string") {
		[str, regex] = [regex, str];
	}

	let ret = [...str.matchAll(regex)].map(({groups}) => processGroups(groups));

	return ret;
}

export function parse (regex, str) {
	let ret = parseAll(regex, str)[0] ?? null;
	ret.raw = str;

	return ret;
}