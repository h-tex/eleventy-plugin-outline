import Heading from "./Heading.js";
import Figures from "./Figures.js";

export default class Outline extends Array {
	// Flat maps of id to object
	#index = new Map();
	#figureIndex = new Map();

	children = [];

	constructor (parent, options) {
		super();

		this.parent = parent;
		Object.defineProperty(this, "options", { value: options, enumerable: false, writable: true });
	}

	get qualifiedNumber () {
		return this.parent?.qualifiedNumber ?? this.parent ?? "";
	}

	/**
	 * Get a figure or heading that corresponds to the given id
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id) {
		return this.#index.get(id) ?? this.#figureIndex.get(id);
	}

	find (callback, options) {
		for (let heading of this) {
			let ret = heading.find(callback, options);

			if (ret !== undefined) {
				return ret;
			}
		}

		return null;
	}

	add (heading) {
		let last = this.at(-1); // possibly ancestor

		if (last && heading.level > last.level) {
			// This is a child
			heading = last.add(heading);
		}
		else {
			// This is a top-level section
			heading = new Heading({
				...heading,
				number: this.length + 1,
				parent: this,
			}, this.options);
			this.push(heading);
		}

		this.#index.set(heading.id, heading);

		return heading;
	}

	addFigure (figure) {
		let last = this.at(-1);

		if (last) {
			figure = last.addFigure(figure);
		}
		else {
			this.figures ??= new Figures(this);
			figure = this.figures.add(figure);
		}

		this.#figureIndex.set(figure.id, figure);
		return figure;
	}

	toJSON () {
		return this.slice();
	}
}

