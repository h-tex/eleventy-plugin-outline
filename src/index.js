export const defaultLabels = {
	"fig": "Figure",
	"tab": "Table",
	// "eq": "Equation",
	// "sec": "Section",
	// "appendix": "Appendix",
}

function getIdRegex ({idFormat, flags = "gi"} = {}) {
	return RegExp(`\\bid=(["']?)(${ idFormat?.source ?? ".+?"})(?=\\1|$|>|\\s)\\1`, flags);
}

const idRegex = getIdRegex({flags: "i"});

function qualifyNumber (scope, number) {
	return scope ? `${ scope }.${ number }` : number;
}

function findHeading (outline, needle) {
	for (let info of outline) {
		if (info.id === needle.id && info.level === needle.level) {
			return info;
		}

		if (info.children && info.level < needle.level) {
			let ret = findHeading(info.children, needle);
			if (ret !== undefined) {
				return ret;
			}
		}
	}
}

function addToOutline (outline, info, qualifiedNumber = "") {
	// First, check if the heading is already added
	let found = findHeading(outline, info);
	if (found) {
		return found;
	}

	let last = outline.at(-1); // possibly ancestor

	if (!last || info.level <= last.level) {
		// This is a top-level section
		let number = info.number = outline.length + 1;
		info.qualifiedNumber = qualifyNumber(qualifiedNumber, number);
		outline.push(info);
	}
	else {
		// This is a child
		last.children ??= [];
		addToOutline(last.children, info, last.qualifiedNumber);
	}

	return info;
}

class Outlines {}
let outline = new Outlines();

export default function (config, {labels = defaultLabels} = {}) {
	let labelsRegex = `(?<type>${ Object.keys(labels).join("|") })`;
	let defRegex = getIdRegex({idFormat: RegExp(labelsRegex + ":(?<id>.+)")});



	config.addGlobalData("outline", outline);

	function extractXRefs (content, scope) {
		for (let match of content.matchAll(defRegex)) {
			let {type, id} = match.groups;
			let start = match.index;
			let end = start + match[0].length;

			if (!outline?.[scope]?.[type]) {
				outline[scope] ??= {};
				outline[scope][type] ??= new Map();
			}

			let xrefs = outline[scope][type];
			let info = xrefs.get(id);
			if (!info) {
				let number = xrefs.size + 1;
				let qualifiedNumber = scope + "." + number;
				info = {number, qualifiedNumber, index: start};
				xrefs.set(id, info);
			}
		}
	}

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
			let info = {id, level, text};

			if (!outline?.[scope]?.sections) {
				outline[scope] ??= {};
				outline[scope].sections ??= [];
			}

			// Find where this fits in the existing hierarchy
			info = addToOutline(outline[scope].sections, info, scope);

			return `<h${level} data-number="${ info.qualifiedNumber }"${attrs}>${text}</h${level}>`;
		});

		return content;
	}



	config.addFilter("outline", function (content, scope = "") {
		content = extractAndReplaceXRefs(content, scope);
		return content;
	});

	config.addTransform("outline", function (content, outputPath) {
		return content;
	});

}