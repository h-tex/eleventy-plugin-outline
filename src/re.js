let defaults = {
	tag: "(\\w+:)?[\\w-]+",
	attrs: "[^>]*",
	content: "[\\S\\s]*?",
}

export function id (idFormat) {
	return attribute("id", idFormat);
}

export function attribute (name, value = ".+?") {
	return re`\\b${ name }=(?<q>["']?)(?<value>${ value })(?=\\k<q>|\\s|>|$)\\k<q>`;
}

/**
 * Returns a regular expression that matches an element with the specified criteria.
 * Caveat: element cannot have another element of the same type nested within (yes, you shouldn't parse HTML with regexes)
 * @param {*} options
 * @returns
 */
export function element ({tag = defaults.tag, attr, attrs = defaults.attrs, content = defaults.content} = {}) {
	if (attr) {
		attr = attribute(attr.name, attr.value);
		attrs = re`${attrs}${ attr }${attrs}`;
	}

	return re`(?<open><(?<tag>${tag})\\b(?<attrs>${attrs})>)(?<content>${ content })(?<close></\\k<tag>>)`;
}

/**
 * Template tag function that composes a RegExp object from a template string and smaller regexes.
 * @param {*} strings
 * @param  {...any} values
 * @returns
 */
export default function re (strings, ...values) {
	let flags = "gi";
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