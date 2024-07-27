import Outline from "./Outline.js";
import re, * as match from "./re.js";
import * as html from "./html.js";
import {slugify} from "./util.js";

const headingRegex = html.element({tag: "h(?<level>[1-6])"});
const figRegex = html.element({tag: "figure|table"});
const captionRegex = html.element({tag: "figcaption"});
const defRegex = re`${figRegex}|${headingRegex}`;
const refRegex = html.element({tag: "a", attr: {name: "href", value: "#.+?"}, content: ""});

const attributesToProperties = {
	"data-number": "qualifiedNumber",
	"data-label": "label",
	"data-own-number": "number",
	"data-qualified-number-prefix": "qualifiedNumberPrefix",
};

export default class Outlines {
	constructor (options = {}) {
		options = Object.assign({}, Outlines.defaultOptions, options);
		Object.defineProperty(this, "options", {value: options, enumerable: false});
	}

	static defaultOptions = {
		getHeadingType (info) {
			if (info.level == 1) {
				return "chapter";
			}
		},
		getHeadingLabel (info, type) {

		},
		excludeHeading (info, scope) {
			return false;
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
		getFigureLabel (figure, type) {},
		excludeFigure (info, scope) {
			return false;
		},
		figureTags: ["figure", "table"],
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

			if (outline instanceof Outline) {
				let ret = outline.getById(id);
				if (ret) {
					return ret;
				}
			}
		}

		return null;
	}

	pageToScopes = {};
	scopeToPages = {};

	/**
	 * Process raw HTML, extract headings and figures, and build an outline
	 * @param {*} content
	 * @param {*} scope
	 * @returns {string} The updated content
	 */
	process (content, scope, context) {
		let {inputPath, outputPath, url} = context?.page ?? {};
		scope ??= url ?? "";
		(this.pageToScopes[url] ??= new Set()).add(scope);
		(this.scopeToPages[scope] ??= new Set()).add(url);

		// Sections
		content = content.replaceAll(defRegex, (originalHTML, ...args) => {
			let groups = match.processGroups(args.at(-1));
			let {tag, attrs = "", content, level} = groups;
			let attributes = html.parseAttributes(attrs);
			let id = attributes.id;
			let index = args.at(-3);
			let info = {id, level: level ? Number(level) : undefined, attrs, attributes, index, html: originalHTML, content, inputPath, outputPath, url};
			let isHeading = tag.startsWith("h");

			if (groups.close === undefined && !html.voidElements.has(tag)) {
				console.warn(`[outline] Unterminated ${ originalHTML } at ${ index } in ${ scope } (${ inputPath })`);
				return originalHTML;
			}


			let outline = this[scope] ??= new Outline(null, this.options);

			if (id) {
				info.originalId = id;
			}
			else {
				// Set id if not present
				if (isHeading) {
					// Strip HTML
					info.text = html.textContent(content);
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
			}

			// Check for duplicates
			let duplicate = outline.getById(id);
			if (duplicate) {
				// Duplicate id
				let i = 2;
				while (outline.getById(id + "-" + i)) {
					i++;
				}
				id += "-" + i;

				if (info.originalId) {
					console.log(`[outline] Duplicate id: ${ info.originalId } → ${ id } in ${ scope }`);
				}
			}

			if (info.originalId === id) {
				delete info.originalId;
			}
			else {
				attributes.id = id;
			}

			for (let attribute in attributesToProperties) {
				if (attributes[attribute]) {
					info[attributesToProperties[attribute]] = attributes[attribute];
				}
			}

			info.id = id;
			info.originalHTML = originalHTML;

			if (isHeading) {
				if (this.options.excludeHeading.call(context, info, scope)) {
					return originalHTML;
				}

				// Find where this fits in the existing hierarchy
				info = outline.add(info);
			}
			else {
				if (this.options.excludeFigure.call(context, info, scope)) {
					return originalHTML;
				}

				// Figure. Here the qualified number is only 2 levels deep: <scope> . <number>
				info = outline.addFigure(info);
			}

			attributes["data-number"] ??= info.qualifiedNumber;
			attributes["data-label"] ??= info.label;

			let numberHTML = html.stringifyElement({
				tag: isHeading ? "a" : "span",
				attrs: (isHeading ? ` href="#${ id }"` : "") + ` class="outline-number"`,
				content: `${ info.qualifiedNumberPrefix ?? "" }<span class="this-number">${ info.number }</span>`,
			});

			if (isHeading) {
				content = numberHTML + `<a href="#${ id }" class="header-anchor">${ content }</a>`;
			}
			else {
				content = content.replace(captionRegex, (captionHtml, ...args) => {
					let caption = match.processGroups(args.at(-1));
					info.caption = caption;
					caption.originalHTML = captionHtml;

					let captionContent = `<a href="#${ id }" class="label">${ info.label } ${ numberHTML }</a>` + caption.content;
					return caption.html = html.stringifyElement({
						...caption,
						content: captionContent,
					});
				});
			}

			info.html = html.stringifyElement({tag, attributes, content});

			return info.html;
		});

		return content;
	}

	/**
	 * Get the outline associated with the current scope
	 * @param {*} scope
	 * @returns {Outline | null} The outline if exactly one exists, otherwise null.
	 */
	get (scope, page) {
		if (!scope) {
			// If no scope provided, check if page is associated with exactly one
			let pageScopes = this.pageToScopes[page.url];

			if (!pageScopes || pageScopes.size !== 1) {
				// If multiple scopes per page, we need an explicit scope to be passed in
				// If no scopes per page, there’s nothing to do
				return null;
			}

			scope = pageScopes.values().next().value;
		}

		return this[scope] ?? null;
	}

	/**
	 * Replace empty xref links with labels like "Figure 3.2"
	 * @param {*} content
	 * @param {string} scope
	 * @returns {string} The updated content
	 */
	resolveXRefs (content, scope, context) {
		let outline = this.get(scope, context?.page);

		if (!outline) {
			return content;
		}

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