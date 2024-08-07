import OutlineNode from "./OutlineNode.js";

export default class OutlineItems extends OutlineNode {
	items = new Map();

	constructor (parent, options = parent?.options) {
		super(parent, options);

		Object.defineProperties (this, {
			countsByType: { value: {}, enumerable: false, writable: true },
		});
	}

	get progressRoot () {
		return !this.parent || this.isProgressRoot ? this : this.parent.progressRoot;
	}

	get qualifiedNumber () {
		return this.parent?.qualifiedNumber ?? "";
	}

	get firstValue () {
		return this.items.values().next().value;
	}

	get lastValue () {
		return this.values().at(-1);
	}

	get rootItem () {
		return this.parent?.rootItem ?? null;
	}

	values () {
		return [...this.items.values()];
	}

	find (callback, options) {
		for (let item of this.items) {
			let ret = item.find(callback, options);

			if (ret !== undefined) {
				return ret;
			}
		}

		return null;
	}

	[Symbol.iterator] () {
		return this.items[Symbol.iterator]();
	}

	add (info) {
		let item = new this.constructor.of(info, this.options, this);

		this.countsByType[item.type] ??= 0;

		item.number ??= ++this.countsByType[item.type];

		this.items.delete(info.id); // This should not exist anyway
		this.items.set(item.id, item);
		this.index.set(item.id, item);

		return item;
	}

	toString () {
		return `${ this.constructor.name }(${ this.values().map(String).join(", ") })`;
	}

	toJSON () {
		return this.values();
	}
}
