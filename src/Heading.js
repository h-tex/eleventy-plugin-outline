import Outline from "./Outline.js";
import Figures from "./Figures.js";

export default class Heading {
	// TODO chapter, appendix…
	constructor (info, options) {
		// Object.assign(this, info);
		if (info.qualifiedNumber) {
			// If the number is custom-set, we don’t really have a prefix
			info.qualifiedNumberPrefix ??= "";
		}

		for (let property in info) {
			// We want to be able to override the getters, e.g. to provide a custom number
			Object.defineProperty(this, property, {value: info[property], enumerable: true, writable: true});
		}

		if (this.parent?.level && this.parent.level < this.level - 1) {
			console.warn(`Level jump: From <${this.tag}${this.attrs}>${this.text}</${this.tag}> to <${this.parent.tag}${this.parent.attrs}>${this.parent.text}</${this.parent.tag}>`);
		}

		// this.options = options;
		Object.defineProperty(this, "options", { value: options, writable: true });

		this.type ??= this.options.getHeadingType(info) ?? "section";
		this.label ??= this.options.getHeadingLabel(info) ?? this.type[0].toUpperCase() + this.type.slice(1);
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

	toJSON () {
		return Object.assign({}, this);
	}
}
