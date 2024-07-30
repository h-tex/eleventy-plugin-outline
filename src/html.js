/**
 * A set of utilities to do what should never be done: parse HTML with regexes.
 */
import re, { parse, parseAll } from "./re.js";

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

// Elements that don’t need an end tag
export const voidElements = new Set([
	"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"
]);

/**
 * Returns a regular expression that matches an element with the specified criteria.
 * Caveat: element cannot have another element of the same type nested within (yes, you shouldn't parse HTML with regexes)
 * @param {*} options
 * @returns
 */
export function element ({tag = defaults.tag, attr, attrs = defaults.attrs, content = defaults.content, allowEmpty = false} = {}) {
	if (attr) {
		attr = attribute(attr);
		attrs = re`${attrs}${ attr }${attrs}`;
	}

	return re`(?<open><(?<tag>${tag})\\b(?<attrs>${attrs})>)(?:(?<content>${ content })(?<close></\\k<tag>>))${ allowEmpty ? "?" : "" }`;
}

export function parseAttributes (source) {
	if (source === undefined) {
		return;
	}

	let pattern = attribute();
	let all = parseAll(pattern, source);

	let ret = Object.fromEntries(all.map(o => [o.name, o.value]));
	Object.defineProperties(ret, {
		"__source": {value: source},
		"toString": {
			value: function () {
				return stringifyAttributes(this);
			}
		},
	});

	return ret;
}

export function stringifyAttributes (attributes) {
	return Object.entries(attributes).map(([name, value]) => {
		if (value === undefined || value === null) {
			return "";
		}

		if (value === true) {
			return name;
		}

		value = value + "";

		let has = {quot: value.includes('"'), apos: value.includes("'")};
		let q = '"';
		if (has.quot && has.apos) {
			// Escape double quotes
			value = value.replaceAll('"', "&quot;");
		}
		else if (has.quot) {
			q = "'";
		}

		return `${ name }=${q}${ value }${q}`;
	}).join(" ");
}

export function stringifyElement (element) {
	let {tag = "div", attributes, attrs, content = ""} = element;

	if (attributes) {
		attrs = stringifyAttributes(attributes);
	}
	attrs = attrs ? ` ${ attrs.trimLeft() }` : "";

	let ret = `<${ tag }${ attrs }>${ content }</${ tag }>`;

	return ret;
}

const anyLeafElement = element({content: "[^<]*"});
const anyVoidElement = element({tag: [...voidElements].join("|"), allowEmpty: true});
export function textContent (content) {

	content = content.replaceAll(anyVoidElement, "");
	let previousContent;

	do {
		previousContent = content;
		// Trim and collapse whitespace
		content = content.trim().replace(/\s+/g, " ");
		content = content.replaceAll(anyLeafElement, "$<content>");
	} while (content !== previousContent);

	return content;
}