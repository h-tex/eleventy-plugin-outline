import Heading from "./Heading.js";
import Figures from "./Figures.js";
import OutlineItems from "./OutlineItems.js";

export default class Outline extends OutlineItems {
	// Flat maps of id to object
	#index = new Map();
	#figureIndex = new Map();
	static of = Heading;

	/**
	 * Will return this if it contains more than one top-level section
	 * or the only top-level section if there is only one.
	 * This is mainly useful for displaying tables of contents.
	 */
	get toc () {
		if (this.size === 1) {
			return this.firstValue.children;
		}

		return this;
	}

	/**
	 * Get a figure or heading that corresponds to the given id
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id) {
		return this.#index.get(id) ?? this.#figureIndex.get(id);
	}

	add (heading) {
		let last = this.lastValue; // possibly ancestor

		if (last && heading.level > last.level) {
			// This is a child
			heading = last.add(heading);
		}
		else {
			// This is a top-level section
			heading = super.add(heading);
		}

		this.#index.set(heading.id, heading);

		return heading;
	}

	addFigure (figure) {
		let last = this.lastValue;

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
}

