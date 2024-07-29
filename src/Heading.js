import Outline from "./Outline.js";
import Figures from "./Figures.js";
import OutlineItem from "./OutlineItem.js";

export default class Heading extends OutlineItem {
	kind = "section";
	static defaultType = "section";

	// TODO chapter, appendix…
	constructor (info, options, parent) {
		super(info, options, parent);

		if (this.parent?.level && this.parent.level < this.level - 1) {
			console.warn(`[outline] Level jump in ${this.url}: From ${this.parent} to ${this}`);
		}
	}

	getById (id) {
		if (this.id === id) {
			return this;
		}

		return this.children?.getById(id) ?? this.figures?.getById(id);
	}

	find (test, {descendIf} = {}) {
		if (typeof test === "function") {
			if (test(this) !== undefined) {
				return this;
			}
		}
		else if (typeof test === "object" && test !== null) {
			if (Object.keys(test).every(key => test[key] === this[key])) {
				return this;
			}

			if (test.level) {
				descendIf ??= info => info.level < test.level;
			}
		}

		if (this.children && this.level < 6 && (!descendIf || descendIf(this))) {
			return this.children.find(test, {descendIf});
		}
	}

	add (child) {
		this.children ??= new Outline(this, this.options);
		return this.children.add(child);
	}

	addFigure (figure) {
		this.figures ??= new Figures(this, this.options);
		return this.figures.add(figure);
	}
}
