import { capitalize } from "./util.js";

export default class Figure {
	constructor (info, options, parent) {
		for (let property in info) {
			// We want to be able to override the getters, e.g. to provide a custom number
			Object.defineProperty(this, property, {value: info[property], enumerable: true, writable: true});
		}

		Object.defineProperties(this, {
			parent: { value: parent, enumerable: false, writable: true },
			options: { value: options, enumerable: false, writable: true },
		});

		this.type ??= this.options.getFigureType(info) ?? "figure";
		this.label ??= this.options.getFigureLabel(info, this.type) ?? capitalize(this.type);
	}

	get numberSeparator () {
		return this.options.figureNumberSeparator ?? ".";
	}

	get qualifiedNumber () {
		return this.qualifiedNumberPrefix + this.number;
	}

	get qualifiedNumberPrefix () {
		return this.parent.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
	}
}