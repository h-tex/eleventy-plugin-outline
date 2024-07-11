import Outline from "./Outline.js";
import Outlines from "./Outlines.js";
import re, * as match from "./re.js";

const idRegex = RegExp(match.id().source, "i");
const headingRegex = match.element({tag: "h(?<level>[2-6])"});
const refRegex = match.element({tag: "a", attr: {name: "href", value: "#.+?"}, content: ""});
const figRegex = match.element({
	attr: {name: "id"},
	tag: "figure|table"
});
const defRegex = re`${figRegex}|${headingRegex}`;

const outline = new Outlines();

export default function (config, {labels} = {}) {
	config.addGlobalData("outline", outline);

	function extractAndReplaceXRefs (content, scope) {
		// Sections
		content = content.replaceAll(defRegex, (html, ...args) => {
			let groups = match.processGroups(args.at(-1));
			let {tag, attrs, content} = groups;
			let index = args.at(-3);

			outline[scope] ??= new Outline(scope);

			if (tag.startsWith("h")) {
				let {level} = groups;

				// Trim and collapse whitespace
				let text = content.trim().replace(/\s+/g, " ");
				let id = attrs.match(idRegex)?.[2];

				// TODO set id if not present
				if (!id) {
					// Abort mission
					return html;
				}
				// For now, we assume that the id is always present
				let info = {id, level, text, attrs, index, html};

				// Find where this fits in the existing hierarchy
				info = outline[scope].add(info);

				let attributesToAdd = `data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;

				return info.html = `<h${level} ${attributesToAdd}${attrs}>${text}</h${level}>`;
			}
			else {
				// Figure. Here the qualified number is only 2 levels deep: <scope> . <number>
				let {value: id} = groups;

				let info = {id, index, html};
				info = outline[scope].addFigure(info);

				let attributesToAdd = `data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;

				html = html.replace("<" + tag, `$& ${ attributesToAdd }`)
				html = html.replace(/<(?:fig)?caption/gi, `$& ${ attributesToAdd }`);

				return info.html = html;
			}
		});

		return content;
	}

	config.addFilter("outline", function (content, scope = "") {
		content = extractAndReplaceXRefs(content, scope);
		return content;
	});

	config.addTransform("outline", function (content, outputPath) {
		content = content.replaceAll(refRegex, (match, ...args) => {
			let groups = args.at(-1);
			let id = groups.value.slice(1);
			let info = outline.getById(id);

			if (!info) {
				return match;
			}

			return groups.open + info.label + " " + info.qualifiedNumber + groups.close;
		});

		return content;
	});
}
