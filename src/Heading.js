import Outline from "./Outline.js";
import Figures from "./Figures.js";
import { qualifyNumber } from "./util.js";

export default class Heading {
	// TODO chapter, appendix…
	static from (o) {
		if (!o) {
			return null;
		}

		if (!(o instanceof this) && typeof o === "object") {
			Object.setPrototypeOf(o, this.prototype);
		}

		o.type ??= "section";
		o.label ??= "Section";

		return o;
	}

	get qualifiedNumber () {
		return qualifyNumber(this.parent.qualifiedNumber, this.number);
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
		this.children ??= new Outline(this);
		return this.children.add(child);
	}

	addFigure (figure) {
		this.figures ??= new Figures(this);
		return this.figures.add(figure);
	}

	toString () {
		let {level, text, attrs, qualifiedNumber} = this;
		return `<h${level} data-number="${ qualifiedNumber }"${attrs}>${text}</h${level}>`;
	}

	toJSON () {
		return Object.assign({}, this);
	}
}
