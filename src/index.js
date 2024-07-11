import Outline from "./Outline.js";
import { qualifyNumber, getIdRegex } from "./util.js";

export const defaultLabels = {
	"fig": "Figure",
	"tab": "Table",
	// "eq": "Equation",
	// "sec": "Section",
	// "appendix": "Appendix",
}

const idRegex = getIdRegex({flags: "i"});

class Outlines {}
let outline = new Outlines();

export default function (config, {labels = defaultLabels} = {}) {
	let labelsRegex = `(?<type>${ Object.keys(labels).join("|") })`;
	let defRegex = getIdRegex({idFormat: RegExp(labelsRegex + ":(?<id>.+)")});

	config.addGlobalData("outline", outline);

	function extractAndReplaceXRefs (content, scope) {
		// Arbitrary references where ids start with one of the known prefixes
		// Here the qualified number is only 2 levels deep: <scope> . <number>
		content = content.replaceAll(defRegex, (match, ...rest) => {
			let [groups, string, start, ...submatches] = rest.reverse();
			let {type, id} = groups;
			let end = start + match.length;

			if (!outline?.[scope]?.[type]) {
				outline[scope] ??= {};
				outline[scope][type] ??= [];
			}

			let xrefs = outline[scope][type];
			let number = xrefs.indexOf(id) + 1 || xrefs.push(id);
			let qualifiedNumber = qualifyNumber(scope, number);

			return `data-number="${ qualifiedNumber }"` + match;
		});

		// Sections
		content = content.replaceAll(/<h(?<level>[2-6])(?<attrs>[\S\s]+?)>(?<text>[\S\s]+?)<\/h\1>/ig, (match, ...args) => {
			let groups = args.pop();
			let {level, attrs, text} = groups;

			// Trim and collapse whitespace
			text = text.trim().replace(/\s+/g, " ");
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
