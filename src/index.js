import Outline from "./Outline.js";

import {
	qualifyNumber,
	getIdRegex,
	matchElementBy,
} from "./util.js";

export const defaultLabels = {
	"fig": "Figure",
	"tab": "Table",
	// "eq": "Equation",
	// "sec": "Section",
	// "appendix": "Appendix",
}

const idRegex = getIdRegex({flags: "i"});
const headingRegex = matchElementBy({tag: "h(?<level>[2-6])"});

class Outlines {}
let outline = new Outlines();

export default function (config, {labels = defaultLabels} = {}) {
	let labelsRegex = `(?<type>${ Object.keys(labels).join("|") })`;
	let defRegex = matchElementBy({
		attr: {name: "id", value: labelsRegex + ":(?<id>.+)"},
		tag: "figure|table"
	});

	config.addGlobalData("outline", outline);

	function extractAndReplaceXRefs (content, scope) {
		// Arbitrary references where ids start with one of the known prefixes
		// Here the qualified number is only 2 levels deep: <scope> . <number>
		content = content.replaceAll(defRegex, (wholeFigure, ...rest) => {
			let [groups, string, start, ...submatches] = rest.reverse();
			let {type, id, tag} = groups;

			if (!outline?.[scope]?.[type]) {
				outline[scope] ??= {};
				outline[scope][type] ??= [];
			}

			let xrefs = outline[scope][type];
			let number = xrefs.indexOf(id) + 1 || xrefs.push(id);
			let qualifiedNumber = qualifyNumber(scope, number);
			let attributesToAdd = `data-number="${ qualifiedNumber }" data-label="${ labels[type] }"`;

			wholeFigure = wholeFigure.replace("<" + tag, `$& ${ attributesToAdd }`)
			wholeFigure = wholeFigure.replace(/<(?:fig)?caption/gi, `$& ${ attributesToAdd }`);

			return wholeFigure;
		});

		// Sections
		content = content.replaceAll(headingRegex, (match, ...args) => {
			let groups = args.pop();
			let {level, attrs, content} = groups;

			// Trim and collapse whitespace
			let text = content.trim().replace(/\s+/g, " ");
			let id = attrs.match(idRegex)?.[2];

			// For now, we assume that the id is always present
			let info = {id, level, text, attrs};

			if (!outline?.[scope]?.sections) {
				outline[scope] ??= {};
				outline[scope].sections ??= new Outline(scope);
			}

			// Find where this fits in the existing hierarchy
			info = outline[scope].sections.add(info);

			return `<h${level} data-number="${ info.qualifiedNumber }"${attrs}>${text}</h${level}>`;
		});

		return content;
	}

	config.addFilter("outline", function (content, scope = "") {
		content = extractAndReplaceXRefs(content, scope);
		return content;
	});

	// config.addTransform("outline", function (content, outputPath) {
	// 	console.log(outline);
	// 	return content;
	// });
}
