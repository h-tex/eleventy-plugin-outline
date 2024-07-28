

export function getType (info) {
	if (info.kind === "figure") {
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
	}
}

export function getLabel (info) {

}

export function ignore (info, scope) {
	return false;
}

export function getMarker (info) {
	let thisNumber = `<span class="this-number">${ info.number }</span>`;

	if (info.kind === "section") {
		return `<a href="#${ info.id }" class="outline-number">${ info.qualifiedNumberPrefix ?? "" }${ thisNumber }</a>`;
	}
	else {
		return `<a href="#${ info.id }" class="label">${ info.label } <span class="outline-number">${ info.qualifiedNumberPrefix ?? "" }${ thisNumber }</span></a>`;
	}
}
