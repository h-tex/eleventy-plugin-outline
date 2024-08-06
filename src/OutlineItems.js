import BetterMap from "./BetterMap.js";

export default class OutlineItems extends BetterMap {
	// Flat maps of id to object
	index = new Map();

	constructor (parent, options = parent?.options) {
		super();

		Object.defineProperties (this, {
			options: { value: options, enumerable: false, writable: true },
			parent: { value: parent, enumerable: false, writable: true },
			countsByType: { value: {}, enumerable: false, writable: true },
		});
	}

	get root () {
		return this.parent ? this.parent.root : this;
	}

	get numberSeparator () {
		return this.options.getSeparator?.(this) ?? ".";
	}

	get qualifiedNumber () {
		return this.parent?.qualifiedNumber ?? "";
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
		for (let item of this) {
			let ret = item.find(callback, options);

			if (ret !== undefined) {
				return ret;
			}
		}

		return null;
	}

	add (info) {
		let item = new this.constructor.of(info, this.options, this);

		this.countsByType[item.type] ??= 0;
		let customNumber = item.number !== undefined;
		item.number ??= ++this.countsByType[item.type];

		this.delete(info.id); // This should not exist anyway
		this.set(item.id, item);

		this.index.set(item.id, item);

		return item;
	}

	toJSON () {
		return [...this.values()];
	}

	// to (changes = {}) {
	// 	let {transform, filter, options, parent = this.parent} = changes;
	// 	let ret = new this.constructor(parent, options ?? this.options);
	// 	ret.start = this.start;
	// 	ret.end = this.end;

	// 	for (let item of this.values()) {
	// 		if (!filter || filter(item)) {
	// 			let newItem = item.to({parent: ret, transform, filter, options});
	// 			ret.set(newItem.id, newItem);
	// 		}
	// 	}

	// 	return ret;
	// }
}
