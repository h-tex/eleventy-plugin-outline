export default class OutlineNode {
	constructor (parent, options = parent?.options) {
		// Flat maps of id to object
		this.index = new Map();

		Object.defineProperties (this, {
			options: { value: options, enumerable: false, writable: true },
			parent: { value: parent, enumerable: false, writable: true },
		});
	}

	get root () {
		return this.parent ? this.parent.root : this;
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

	get numberSeparator () {
		return this.options.getSeparator?.(this) ?? ".";
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
}