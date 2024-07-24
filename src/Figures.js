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
			figure.type = this.parent.options.getFigureType(figure) ?? "figure";
		}

		figure.label = this.parent.options.getFigureLabel(figure) ?? figure.type[0].toUpperCase() + figure.type.slice(1);

		this.#countsByType[figure.type] ??= 0;
		figure.number = ++this.#countsByType[figure.type];

		// Figure numbers are shallow, just <root>.<number>
		figure.qualifiedNumberPrefix = this.root.qualifiedNumber ? this.root.qualifiedNumber + this.numberSeparator : "";
		// figure.qualifiedNumberPrefix = this.parent.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
		figure.qualifiedNumber = figure.qualifiedNumberPrefix + figure.number;

		this.set(figure.id, figure);
		return figure;
	}

	get options () {
		return this.parent.options;
	}

	get numberSeparator () {
		return this.options.figureNumberSeparator ?? ".";
	}
}
