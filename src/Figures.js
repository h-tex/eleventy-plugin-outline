import { qualifyNumber } from "./util.js";

export default class Figures extends Map {
	#countsByType = {};

	constructor (parent) {
		super();
		this.parent = parent;
		this.root = this.getRoot();
	}

	getRoot () {
		let node = this.parent;
		while (node.parent && node !== node.parent) {
			node = node.parent;
		}
		return node;
	}

	add (figure) {
		if (this.has(figure.id)) {
			return this.get(figure.id);
		}

		if (!figure.type) {
			let prefix = figure.id.split(":").reverse().at(-1);

			if (prefix) {
				figure.type = Figures[prefix + ":"] ?? "figure";
			}
			else {
				figure.type = figure.html.includes("<table") ? "table" : "figure";
			}
		}

		figure.label = Figures.labels[figure.type] ?? figure.type[0].toUpperCase() + figure.type.slice(1);

		this.#countsByType[figure.type] ??= 0;
		figure.number = ++this.#countsByType[figure.type];

		// Figure numbers are shallow, just <root>.<number>
		figure.qualifiedNumber = qualifyNumber(this.root.qualifiedNumber, figure.number);
		// figure.qualifiedNumber = qualifyNumber(this.parent.qualifiedNumber, figure.number);

		this.set(figure.id, figure);
		return figure;
	}

	static prefixes = {
		"fig:": "figure",
		"tab:": "table",
		"eq:": "equation",
	}

	static labels = {
		figure: "Figure",
		table: "Table",
		equation: "Equation",
	}
}
