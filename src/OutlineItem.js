import OutlineNode from "./OutlineNode.js";
import { capitalize } from "./util.js";

/**
 * @abstract
 */
export default class OutlineItem extends OutlineNode {
	kind = "item";

	constructor (info, options, parent) {
		super(parent, options);

		Object.defineProperties(this, {
			spec: { value: info, enumerable: false, writable: true },
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


	get qualifiedNumber () {
		return this.qualifiedNumberPrefix + this.number;
	}

	get qualifiedNumberPrefix () {
		return this.parent?.qualifiedNumber ? this.parent.qualifiedNumber + this.numberSeparator : "";
	}

	get parentItem () {
		return this.parent?.parent ?? null;
	}

	get rootItem () {
		return this.parent?.rootItem ?? this;
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
		return this.qualifiedNumber + ". " + this.label;
	}

	add (item) {
		this.index.set(item.id, item);
	}
}