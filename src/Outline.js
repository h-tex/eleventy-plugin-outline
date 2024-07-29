import Heading from "./Heading.js";
import Figures from "./Figures.js";
import OutlineItems from "./OutlineItems.js";

export default class Outline extends OutlineItems {
	static of = Heading;

	urls = new Map();

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

	add (item) {
		let last = this.lastValue; // possibly ancestor

		// Add to last if either it's a heading with a higher level or it's a figure (no level)
		let isFigure = !item.level;
		let addToLast = last && (isFigure || item.level > last.level);

		if (addToLast) {
			// This is a child
			item = last.add(item);
		}
		else {
			// This is a top-level section
			if (isFigure) {
				this.figures ??= new Figures(this);
				item = this.figures.add(item);
			}
			else {
				item = super.add(item);
			}
		}

		if (item.url && this.parent?.url !== item.url) {
			let urls = this.urls.get(item.url) ?? [];
			urls.push(item);
			this.urls.set(item.url, urls);
		}

		this.index.set(item.id, item);

		return item;
	}
}

