export function getHeadingType (info) {
	if (info.level == 1) {
		return "chapter";
	}
}

export function getHeadingLabel (info, type) {

}

export function getHeadingMarker (info, type) {
	return `<a href="#${ info.id }" class="outline-number">${ info.qualifiedNumberPrefix ?? "" }<span class="this-number">${ info.number }</span></a>`;
}

export function getFigureMarker (info, type) {
	return `<a href="#${ info.id }" class="label">${ info.label } <span class="outline-number">${ info.qualifiedNumberPrefix ?? "" }<span class="this-number">${ info.number }</span></span></a>`;
}

export function excludeHeading (info, scope) {
	return false;
}

export function getFigureType (figure) {
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

export function getFigureLabel (figure, type) {}

export function excludeFigure (info, scope) {
	return false;
}

export const figureTags = ["figure", "table"];