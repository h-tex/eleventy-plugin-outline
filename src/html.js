/**
 * A set of utilities to do what should never be done: parse HTML with regexes.
 */
import re, { processGroups } from "./re.js";

export const defaults = {
	tag: "(\\w+:)?[\\w-]+",
	attrs: "[^>]*",
	content: ".*?",
	attributeName: "(\\w+:)?[\\w-]+",
	attributeValue: ".+?",
}

export function id (idFormat) {
	return attribute({ name: "id", value: idFormat });
}

export function attribute ({ name = defaults.attributeName, value = defaults.attributeValue } = {}) {
	return re`\\b(?<name>${ name })=(?<q>["']?)(?<value>${ value })(?=\\k<q>|\\s|>|$)\\k<q>`;
}

/**
 * Returns a regular expression that matches an element with the specified criteria.
 * Caveat: element cannot have another element of the same type nested within (yes, you shouldn't parse HTML with regexes)
 * @param {*} options
 * @returns
 */
export function element ({tag = defaults.tag, attr, attrs = defaults.attrs, content = defaults.content} = {}) {
	if (attr) {
		attr = attribute(attr);
		attrs = re`${attrs}${ attr }${attrs}`;
	}

	return re`(?<open><(?<tag>${tag})\\b(?<attrs>${attrs})>)(?:(?<content>${ content })(?<close></\\k<tag>>))?`;
}

export function parseAll (regex, str) {
	if (str instanceof RegExp && typeof regex === "string") {
		[str, regex] = [regex, str];
	}

	return [...str.matchAll(regex)].map(({groups}) => processGroups(groups));
}

export function parse (regex, str) {
	return parseAll(regex, str)[0] ?? null;
}