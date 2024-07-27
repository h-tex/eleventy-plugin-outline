export default class OutlineItems extends Map {
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
		let item = new this.constructor.of(info, this.options, this.parent);

		this.countsByType[item.type] ??= 0;
		item.number ??= ++this.countsByType[item.type];

		this.delete(info.id); // This should not exist anyway
		this.set(item.id, item);

		return item;
	}
}
