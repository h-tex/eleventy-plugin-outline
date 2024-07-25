import Outline from "./Outline.js";
import Figures from "./Figures.js";

export default class Heading {
	// TODO chapter, appendix…
	constructor (heading, options) {
		Object.assign(this, heading);

		if (this.parent?.level && this.parent.level < this.level - 1) {
			console.warn(`Level jump: From <${this.tag}${attrs}>${this.text}</${this.tag}> to <${this.parent.tag}${this.parent.attrs}>${this.parent.text}</${this.parent.tag}>`);
		}

		this.options = options;
		this.type ??= this.options.getHeadingType(heading) ?? "section";
		this.label ??= this.options.getHeadingLabel(heading) ?? this.type[0].toUpperCase() + this.type.slice(1);
	}

	get numberSeparator () {
		return this.options.headingNumberSeparator ?? ".";
	}

	get qualifiedNumber () {
		return this.qualifiedNumberPrefix + this.number;
	}

	get qualifiedNumberPrefix () {
		return this.parent.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
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
