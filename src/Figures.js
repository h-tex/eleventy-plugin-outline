import Figure from "./Figure.js";

export default class Figures extends Map {
	#countsByType = {};

	constructor (parent, options = parent?.options) {
		super();

		Object.defineProperties (this, {
			options: { value: options, enumerable: false, writable: true },
			root: { value: null, enumerable: false, writable: true },
			parent: { value: parent, enumerable: false, writable: true },
		});

		this.root = this.getRoot();
	}

	getRoot () {
		let node = this.parent;
		while (node.parent && node !== node.parent) {
			node = node.parent;
		}
		return node;
	}

	add (info) {
		let figure = new Figure(info, this.options, this.parent);

		this.#countsByType[figure.type] ??= 0;
		figure.number = ++this.#countsByType[figure.type];

		this.set(figure.id, figure);
		return figure;
	}

	get options () {
		return this.options;
	}

	get numberSeparator () {
		return this.options.figureNumberSeparator ?? ".";
	}

	get qualifiedNumber () {
		// Figure numbers are shallow, just <root>.<number>
		return this.root.qualifiedNumber ?? "";
	}
}
