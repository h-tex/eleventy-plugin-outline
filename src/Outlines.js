import Outline from "./Outline.js";
import re, * as match from "./re.js";
import * as html from "./html.js";
import {slugify} from "./util.js";

const idRegex = RegExp(html.id().source, "i");
const elementRegex = html.element();
const headingRegex = html.element({tag: "h(?<level>[1-6])"});
const figRegex = html.element({tag: "figure|table"});
const captionRegex = html.element({tag: "figcaption"});
const defRegex = re`${figRegex}|${headingRegex}`;
const refRegex = html.element({tag: "a", attr: {name: "href", value: "#.+?"}, content: ""});

export default class Outlines {
	constructor (options = {}) {
		options = Object.assign({}, Outlines.defaultOptions, options);
		Object.defineProperty(this, "options", {value: options, enumerable: false});
	}

	static defaultOptions = {
		getFigureLabel (figure) {},
		getHeadingLabel (info, type) {
			if (info.level == 1) {
				return "Chapter";
			}
		},
		getFigureType (figure) {
			if (/^fig(ure)?[:-]/.test(figure.id)) {
				// Early exit to avoid heuristics messing things up
				return "figure";
			}

			if (/^tab(le)?[:-]/.test(figure.id)) {
				return "table";
			}

			if (/^eq(uation)?[:-]/.test(figure.id)) {
				return "equation";
			}

			// No prefix, need to look at content
			if (figure.html.includes("<table")) {
				return "table";
			}

			if (figure.html.includes(figure.html.includes("<math") || figure.html.includes("<mjx-container"))) {
				return "equation";
			}
		},
		getHeadingType (info) {

		},
		figureTags: ["figure", "table"],
		uniqueIdsAcrossScopes: true,
	}

	/**
	 * Get a figure or heading that corresponds to the given id across all scopes
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id, {scopeNot, scopeOnly} = {}) {
		for (let scope in this) {
			if (scope === scopeNot || scopeOnly && scope !== scopeOnly) {
				continue;
			}

			let outline = this[scope];
			let ret = outline.getById(id);
			if (ret) {
				return ret;
			}
		}

		return null;
	}

	/**
	 * Process raw HTML, extract headings and figures, and build an outline
	 * @param {*} content
	 * @param {*} scope
	 * @returns {string} The updated content
	 */
	process (content, scope) {
		// Sections
		content = content.replaceAll(defRegex, (html, ...args) => {
			let groups = match.processGroups(args.at(-1));
			let {tag, attrs = "", content, level} = groups;
			let id = attrs.match(idRegex)?.[2];
			let index = args.at(-3);
			let info = {id, level, attrs, index, html, content};
			let isHeading = tag.startsWith("h");

			this[scope] ??= new Outline(scope, this.options);

			if (isHeading) {
				// Trim and collapse whitespace
				content = content.trim().replace(/\s+/g, " ");
			}

			if (id) {
				info.originalId = id;
			}
			else {
				// Set id if not present
				if (isHeading) {
					// Strip HTML
					info.text = content.replaceAll(elementRegex, "$<content>");
					id = slugify(info.text);
				}
				else {
					info.text = content.match(captionRegex)?.groups?.content;

					if (info.text) {
						// Match first line or until the first period
						let excerpt = text.match(/^.+?(\.|$)/);
						id = "fig-" + slugify(excerpt);
					}
					else {
						id = tag;
					}
				}

				info.id = id;
				attrs += ` id="${ id }"`;
			}

			// Check for duplicates if we’re enforcing uniqueness across all scopes
			// or we’re creating an id
			if (this.options.uniqueIdsAcrossScopes || !info.originalId) {
				let options = {
					scopeNot: info.originalId ? scope : undefined,
					scopeOnly: this.options.uniqueIdsAcrossScopes ? undefined : scope,
				};
				let duplicate = this.getById(id, options);
				if (duplicate && duplicate.index !== info.index) {
					// Duplicate id
					let i = 2;
					while (this.getById(id + "-" + i, options)) {
						i++;
					}
					id += "-" + i;
					attrs = attrs.replace(idRegex, `id="${ id }"`);

					if (info.originalId) {
						console.log(`Duplicate id: ${ info.originalId } → ${ id }`);
					}
				}
			}


			if (info.originalId === id) {
				delete info.originalId;
			}

			info.id = id;
			info.attrs = attrs;

			if (isHeading) {
				// Find where this fits in the existing hierarchy
				info = this[scope].add(info);
			}
			else {
				// Figure. Here the qualified number is only 2 levels deep: <scope> . <number>
				info = this[scope].addFigure(info);
			}

			let attributesToAdd = ` data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;

			if (isHeading) {
				content = `${ getNumberHTML(info, "a", ` href="#${ id }"`) } <a href="#${ id }" class="header-anchor">${ content }</a>`;

				return info.html = `<h${level}${attributesToAdd}${attrs}>${content}</h${level}>`;
			}
			else {
				html = html.replace("<" + tag, `$& ${ attributesToAdd }`);
				html = html.replace(captionRegex, (captionHtml, ...args) => {
					let groups = match.processGroups(args.at(-1));
					let {tag: captionTag, attrs: captionAttrs, content: captionContent} = groups;

					captionContent = `<a href="#${ id }" class="label">${ info.label } ${ getNumberHTML(info) }</a>` + captionContent;

					return `<${ captionTag }${ captionAttrs }>${ captionContent }</${ captionTag }>`;
				});

				return info.html = html;
			}
		});

		return content;
	}

	/**
	 * Replace empty xref links with labels like "Figure 3.2"
	 * @param {*} content
	 * @param {string} scope
	 * @returns {string} The updated content
	 */
	resolveXRefs (content, scope) {
		let outline = scope === undefined ? this : this[scope];

		content = content.replaceAll(refRegex, (match, ...args) => {
			let groups = args.at(-1);
			let id = groups.value.slice(1);
			let info = outline.getById(id);

			if (!info) {
				// Not found
				return match;
			}

			return groups.open + info.label + " " + info.qualifiedNumber + groups.close;
		});

		return content;
	}
}

function getNumberHTML (info, tag = "span", attrs = "") {
	return `<${tag}${attrs} class="outline-number">${ info.qualifiedNumberPrefix }<span class="this-number">${ info.number }</span></${ tag }>`;
}