import Outline from "./Outline.js";
import re, { processGroups } from "./re.js";
import * as html from "./html.js";
import {
	slugify,
	rebase_url,
	get_path,
	get_hash,
} from "./util.js";
import * as defaultOptions from "./defaultOptions.js";

const headingRegex = html.element({tag: "h(?<level>[1-6])"});
const figRegex = html.element({tag: "figure|table"});
const captionRegex = html.element({tag: "figcaption"});
const defRegex = re`${figRegex}|${headingRegex}`;
const emptyLink = html.element({tag: "a", content: ""});
const hrefRegex = html.attribute({name: "href"});

const attributesToProperties = {
	"data-number": "qualifiedNumber",
	"data-label": "label",
	"data-own-number": "number",
	"data-prefix": "qualifiedNumberPrefix",
};

export default class Outlines {
	constructor (options = {}) {
		Object.defineProperty(this, "options", {value: Object.create(defaultOptions), enumerable: false});

		for (let key in options) {
			this.options[key] = function (...args) {
				let ret = options[key].call(this, ...args);

				if (ret === undefined && defaultOptions[key]) {
					return defaultOptions[key].call(this, ...args);
				}

				return ret;
			 };
		}
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

	processSpec (info, scope, {openIgnoredHeading} = {}) {
		if (openIgnoredHeading && (openIgnoredHeading.level > level || !level)) {
			// Once a heading is ignored, all its descendants are also ignored
			return false;
		}

		let {id, attributes, tag, level} = info;
		let isHeading = info.tag.startsWith("h");
		info.kind = isHeading ? "section" : "figure";

		let outline = this[scope] ??= new Outline(null, this.options);

		if (id) {
			info.originalId = id;
		}
		else {
			// Set id if not present
			if (isHeading) {
				// Strip HTML
				id = slugify(info.text);
			}
			else {
				if (info.text) {
					// Match first line or until the first period
					let excerpt = info.text.match(/^.+?(\.|$)/);
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
				console.warn(`[outline] Duplicate id: ${ info.originalId } → ${ id } in ${ scope }`);
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

		if (this.options.ignore(info, scope)) {
			if (isHeading) {
				openIgnoredHeading = info;
			}

			return null;
		}

		info = outline.add(info);

		attributes["data-number"] ??= info.qualifiedNumber;
		attributes["data-label"] ??= info.label;

		info.marker = this.options.getMarker(info, scope);

		return info;
	}

	/**
	 * Process raw HTML, extract headings and figures, and build an outline
	 * @param {*} content
	 * @param {*} scope
	 * @returns {string} The updated content
	 */
	processHTML (content, scope, page = {}) {
		let {inputPath, outputPath, url} = page;
		scope = (scope === true ? undefined : scope) ?? url ?? "";
		(this.pageToScopes[url] ??= new Set()).add(scope);
		(this.scopeToPages[scope] ??= new Set()).add(url);

		// Sections
		let openIgnoredHeading;
		content = content.replaceAll(defRegex, (originalHTML, ...args) => {
			let groups = processGroups(args.at(-1));
			let {tag, attrs = "", content, level} = groups;

			if (openIgnoredHeading && (openIgnoredHeading.level > level || !level)) {
				// Once a heading is ignored, all its descendants are also ignored
				return originalHTML;
			}

			let attributes = html.parseAttributes(attrs);
			let id = attributes.id;
			let start = args.at(-3);
			let info = {
				id, level: level ? Number(level) : undefined,
				tag, attributes, start,
				html: originalHTML, originalHTML,
				content,
				inputPath, outputPath, url
			};

			let isHeading = info.tag.startsWith("h");
			if (isHeading) {
				info.text = html.textContent(content);
			}
			else {
				info.text = content.match(captionRegex)?.groups?.content;
			}

			info = this.processSpec(info, scope, {openIgnoredHeading});

			if (!info) {
				return originalHTML;
			}

			if (isHeading) {
				content = info.marker + `<a href="#${ attributes.id }" class="header-anchor">${ content }</a>`;
			}
			else {
				content = content.replace(captionRegex, (captionHtml, ...args) => {
					let caption = processGroups(args.at(-1));
					info.caption = caption;
					caption.originalHTML = captionHtml;

					let captionContent = info.marker + caption.content;
					return caption.html = html.stringifyElement({
						...caption,
						content: captionContent,
					});
				});
			}

			info.processedContent = content;
			info.html = html.stringifyElement({tag, attributes, content});

			if (this.options.transform) {
				info.html = this.options.transform(info, scope) ?? info.html;
			}

			return info.html;
		});

		return content;
	}

	/**
	 * Process raw HTML, extract headings and figures, and build an outline
	 * @param {*} content
	 * @param {*} scope
	 * @returns {string} The updated content
	 */
	processNode (node, scope, page = {}) {
		let {inputPath, outputPath, url} = page;
		scope = (scope === true ? undefined : scope) ?? url ?? "";
		(this.pageToScopes[url] ??= new Set()).add(scope);
		(this.scopeToPages[scope] ??= new Set()).add(url);

		// Sections
		let openIgnoredHeading;
		for (let element of node.querySelectorAll("h1, h2, h3, h4, h5, h6, figure, table")) {
			if (openIgnoredHeading && (openIgnoredHeading.level > level || !level)) {
				// Once a heading is ignored, all its descendants are also ignored
				return originalHTML;
			}

			let tag = element.tagName.toLowerCase();
			let level = tag.startsWith("h") ? Number(tag.slice(1)) : undefined;
			let attributes = Object.fromEntries([...element.attributes].map(a => [a.name, a.value]));
			let info = {
				id, level, tag, attributes,
				// start,
				html: element.outerHTML,
				content,
				inputPath, outputPath, url
			};
			info.originalHTML = info.html;

			let isHeading = info.tag.startsWith("h");
			let caption;

			if (isHeading) {
				info.text = element.textContent;
			}
			else {
				info.caption = element.querySelector("figcaption") ?? element.querySelector("caption");
				info.text = info.caption.textContent;
			}

			info = this.processSpec(info, scope, {openIgnoredHeading});

			if (!info) {
				continue;
			}

			if (isHeading) {
				element.innerHTML = info.marker + `<a href="#${ id }" class="header-anchor">${ element.innerHTML }</a>`;
			}
			else if (info.caption) {
				info.caption.insertAdjacentHTML("beforebegin", info.marker);
			}

			// Apply attributes
			for (let name in info.attributes) {
				if (element.attributes[name]?.value !== info.attributes[name]) {
					element.setAttribute(name, info.attributes[name]);
				}
			}

			info.html = element.outerHTML;

			if (this.options.transform) {
				let transformedHTML = this.options.transform(info, scope);
				if (transformedHTML !== undefined) {
					element.outerHTML = info.html = transformedHTML;
				}
			}
		}
	}

	/**
	 * Get the outline associated with a given scope or page
	 * @param {*} scope
	 * @returns {Outline | null} The outline if exactly one exists, otherwise null.
	 */
	get (scope, page) {
		scope = scope === true ? undefined : scope;

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
		else if (page && this[scope]) {
			// Both scope and page, need to filter
			return this[scope].to({filter: item => !item || item.url === page.url});
		}

		return this[scope] ?? null;
	}

	/**
	 * Replace empty xref links with labels like "Figure 3.2"
	 * @param {*} content
	 * @param {string} scope
	 * @returns {string} The updated content
	 */
	resolveXRefs (content, scope, page) {
		let outline = this.get(scope, page);

		if (!outline) {
			return content;
		}

		let url = page?.url; // The URL of the referencing page
		let urls = outline.urls; // URLs in this outline

		content = content.replaceAll(emptyLink, (match, ...args) => {
			let groups = processGroups(args.at(-1));
			let info, href;

			let open = groups.open.replace(hrefRegex, (match, ...args) => {
				let groups = processGroups(args.at(-1));
				href = groups.value;

				if (href.startsWith("#")) {
					let id = groups.value.slice(1);
					info = outline.getById(id);
				}
				else if (urls) {
					// Link to another file, do we know this file?
					let rootRelative = "/" + rebase_url(href, url, "/");
					let rootPath = get_path(rootRelative);
					let hash = get_hash(href);
					let headings = urls.get(rootPath) ?? urls.get(rootPath + "/");

					if (headings) {
						let firstHeading = headings.values().next().value;

						if (hash) {
							let id = hash.slice(1);
							info = firstHeading.getById(id);
						}

						// If hash not found, we still want to return firstHeading
						info ??= firstHeading;
					}

					// TODO if page URL is different, rewrite href too
				}

				return match;
			});

			if (!info) {
				// Not found
				return match;
			}

			return open + info.label + " " + info.qualifiedNumber + groups.close;
		});

		return content;
	}

	/**
	 * Replace empty xref links with labels like "Figure 3.2"
	 * @param {*} content
	 * @param {string} scope
	 * @returns {string} The updated content
	 */
	resolveXRefsIn (node, scope, page) {
		let outline = this.get(scope, page);

		if (!outline) {
			return;
		}

		let url = page?.url; // The URL of the referencing page
		let urls = outline.urls; // URLs in this outline

		for (let a of node.querySelectorAll('a[href=""]')) {
			let info;
			let href = a.getAttribute("href");

			if (href.startsWith("#")) {
				let id = groups.value.slice(1);
				info = outline.getById(id);
			}
			else if (urls) {
				// Link to another file, do we know this file?
				// FIXME this will throw in the browser
				let rootRelative = "/" + rebase_url(href, url, "/");
				let rootPath = get_path(rootRelative);
				let hash = get_hash(href);
				let headings = urls.get(rootPath) ?? urls.get(rootPath + "/");

				if (headings) {
					let firstHeading = headings.values().next().value;

					if (hash) {
						let id = hash.slice(1);
						info = firstHeading.getById(id);
					}

					// If hash not found, we still want to return firstHeading
					info ??= firstHeading;
				}

				// TODO if page URL is different, rewrite href too
			}

			if (info) {
				a.textContent = info.label + " " + info.qualifiedNumber;
			}
		}
	}

	clear ({url}) {
		if (this[url] instanceof Outline) {
			delete this[url];
		}
		else {
			let scopes = this.pageToScopes[url];

			if (scopes) {
				for (let scope of scopes) {
					delete this[scope];
				}
			}
		}
	}
}