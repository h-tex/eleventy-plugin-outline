import { capitalize } from "./util.js";
import { stringifyElement } from "./html.js";

/**
 * @abstract
 */
export default class OutlineItem {
	constructor (info, options, parent) {
		if (info.qualifiedNumber) {
			// If the number is custom-set, we don’t really have a prefix
			info.qualifiedNumberPrefix ??= "";
			info.number = info.qualifiedNumber;
		}

		for (let property in info) {
			// We want to be able to override the getters, e.g. to provide a custom number
			Object.defineProperty(this, property, {value: info[property], enumerable: true, writable: true});
		}

		Object.defineProperties(this, {
			parent: { value: parent, enumerable: false, writable: true },
			options: { value: options, enumerable: false, writable: true },
		});

		this.type ??= this.options.getType(info) ?? this.constructor.defaultType;
		this.label ??= this.options.getLabel(info, this.type) ?? capitalize(this.type);
	}

	get numberSeparator () {
		return this.options.getSeparator?.(this) ?? ".";
	}

	get qualifiedNumber () {
		return this.qualifiedNumberPrefix + this.number;
	}

	get qualifiedNumberPrefix () {
		return this.parent.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
	}

	get rootPrefix () {
		return this.parent?.parent ? this.parent.rootPrefix : this.parent.qualifiedNumberPrefix;
	}

	toJSON () {
		return Object.assign({}, this);
	}

	toString () {
		return stringifyElement(this);
	}
}