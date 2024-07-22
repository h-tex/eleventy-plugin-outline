import Outline from "./Outline.js";
import re, * as match from "./re.js";
import {slugify} from "./util.js";

const idRegex = RegExp(match.id().source, "i");
const headingRegex = match.element({tag: "h(?<level>[2-6])"});
const elementRegex = match.element();
const figRegex = match.element({
	attr: {name: "id"},
	tag: "figure|table"
});
const captionRegex = match.element({tag: "figcaption"});
const defRegex = re`${figRegex}|${headingRegex}`;
const refRegex = match.element({tag: "a", attr: {name: "href", value: "#.+?"}, content: ""});

export default class Outlines {
	/**
	 * Get a figure or heading that corresponds to the given id across all scopes
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id) {
		for (let scope in this) {
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
			let {tag, attrs, content} = groups;
			let index = args.at(-3);

			this[scope] ??= new Outline(scope);

			if (tag.startsWith("h")) {
				let {level} = groups;

				// Trim and collapse whitespace
				let text = content.trim().replace(/\s+/g, " ");
				let id = attrs.match(idRegex)?.[2];
				let innerHTML = text;
				let attributesToAdd = "";

				// Set id if not present
				if (!id) {
					let textContent = text.replaceAll(elementRegex, "$k<content>");
					id = slugify(textContent);
					// let existing = this.getById(id);
					// if (existing) {
					// 	console.warn("Duplicate id:", id);
					// }
					attributesToAdd += ` id="${ id }"`;
					innerHTML = `<a class="header-anchor" href="#${ id }">${ text }</a>`;
				}

				let info = {id, level, text, attrs, index, html};

				// Find where this fits in the existing hierarchy
				info = this[scope].add(info);

				attributesToAdd += ` data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;
				innerHTML = `${ getNumberHTML(info) } ` + innerHTML;

				return info.html = `<h${level}${attributesToAdd}${attrs}>${innerHTML}</h${level}>`;
			}
			else {
				// Figure. Here the qualified number is only 2 levels deep: <scope> . <number>
				let {value: id} = groups;

				let info = {id, index, html};
				info = this[scope].addFigure(info);

				let attributesToAdd = `data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;
				html = html.replace("<" + tag, `$& ${ attributesToAdd }`);

				html = html.replace(captionRegex, (captionHtml, ...args) => {
					let groups = match.processGroups(args.at(-1));
					let {tag: captionTag, attrs: captionAttrs, content: captionContent} = groups;

					captionContent = `<span class="label">${ info.label } ${ getNumberHTML(info) }</span>` + captionContent;

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

function getNumberHTML (info) {
	return `<span class="outline-number">${ info.qualifiedNumberPrefix }<span class="this-number">${ info.number }</span></span>`;
}