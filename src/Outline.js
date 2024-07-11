import Heading from "./Heading.js";

export default class Outline extends Array {
	constructor (scope) {
		super();

		this.scope = scope;
	}

	get prefix () {
		return this.scope?.qualifiedNumber ?? this.scope ?? "";
	}

	find (callback, options) {
		for (let heading of this) {
			let ret = heading.find(callback, options);

			if (ret !== undefined) {
				return ret;
			}
		}

		return null;
	}

	add (heading) {
		let found = this.find(heading);
		if (found) {
			return found;
		}

		let last = this.at(-1); // possibly ancestor

		if (last && heading.level > last.level) {
			// This is a child

			return last.add(heading);
		}

		// This is a top-level section
		heading = Heading.from({
			...heading,
			number: this.length + 1,
			parent: this,
		});
		this.push(heading);
		return heading;
	}

	toJSON () {
		return this.slice();
	}
}
