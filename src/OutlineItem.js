import { capitalize } from "./util.js";
import { stringifyElement } from "./html.js";

/**
 * @abstract
 */
export default class OutlineItem {
	kind = "item";

	constructor (info, options, parent) {
		this.index = new Map();

		if (!parent) {
			console.warn("No parent for", info);
		}

		Object.defineProperties(this, {
			spec: { value: info, enumerable: false, writable: true },
			parent: { value: parent, enumerable: false, writable: true },
			options: { value: options, enumerable: false, writable: true },
		});

		if (info.qualifiedNumber) {
			info.pinnedNumber = true;

			// If the number is custom-set, we don’t really have a prefix
			info.qualifiedNumberPrefix ??= "";
			info.number = info.qualifiedNumber;
		}

		for (let property in info) {
			// We want to be able to override the getters, e.g. to provide a custom number
			Object.defineProperty(this, property, {
				value: info[property],
				enumerable: true,
				writable: property !== "id", // we key on id so it should be immutable
			});
		}

		this.type ??= this.options.getType(info) ?? this.constructor.defaultType;
		this.label ??= this.options.getLabel(info, this.type) ?? capitalize(this.type);
	}

	get root () {
		return this.parent ? this.parent.root : this;
	}

	get numberSeparator () {
		return this.options.getSeparator?.(this) ?? ".";
	}

	get qualifiedNumber () {
		return this.qualifiedNumberPrefix + this.number;
	}

	get qualifiedNumberPrefix () {
		return this.parent?.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
	}

	get rootPrefix () {
		let root = this.root;
		let isRoot = root === this;
		return isRoot ? "" : root.qualifiedNumber + this.numberSeparator;
	}

	nextItem () {
		return this.parent?.valueAfter(this);
	}

	/**
	 * Get an item corresponds to the given id
	 * regardless of how deeply nested it might be
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id) {
		return this.index.get(id);
	}

	find (callback, options) {
		let ret = callback(this)
		if (ret !== undefined) {
			return ret;
		}

		return this.children.find(callback, options);
	}

	toJSON () {
		return Object.assign({}, this);
	}

	toString () {
		return stringifyElement(this);
	}

	// to (changes = {}) {
	// 	let {spec, transform, filter, options, parent} = changes;
	// 	spec = Object.assign({}, this.spec, {number: this.number}, spec);
	// 	options = Object.assign({}, this.options, options);
	// 	let ret = new this.constructor(spec, options, parent ?? this.parent);
	// 	ret.start = this.start;
	// 	ret.end = this.end;
	// 	ret = transform ? transform(ret) : ret;

	// 	if (this.children) {
	// 		ret.children = this.children.to({parent: ret, transform, filter, options});
	// 	}

	// 	if (this.figures) {
	// 		ret.figures = this.figures.to({parent: ret, transform, filter, options});
	// 	}

	// 	return ret;
	// }

	add (item) {
		this.index.set(item.id, item);
	}
}