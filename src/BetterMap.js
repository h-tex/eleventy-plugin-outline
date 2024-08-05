export default class BetterMap extends Map {
	get firstValue () {
		return this.values().next().value;
	}

	get lastValue () {
		return [...this.values()].at(-1);
	}

	get length () {
		return this.size;
	}

	indexOf (key) {
		let i = 0;
		for (let k of this.keys()) {
			if (k === key) {
				return i;
			}
			i++;
		}
		return -1;
	}

	/**
	 * Inserts a key-value pair at the specified index
	 * while preserving object references to this and the keys/values
	 * @param {number} index
	 * @param {*} key
	 * @param {*} value
	 */
	insertAt (index, key, value) {
		let pairs = [];
		let entries = [...this.entries()].slice(index);

		for (let [k, v] of entries) {
			this.delete(k);
			pairs.push([k, v]);
		}

		entries.unshift([key, value]);

		for (let [k, v] of entries) {
			this.set(k, v);
		}
	}

	insertBefore (key, newKey, value) {
		let index = this.indexOf(key);
		if (index === -1) {
			return false;
		}

		this.insertAt(index, newKey, value);
	}

	insertAfter (key, newKey, value) {
		let index = this.indexOf(key);
		if (index === -1) {
			return false;
		}

		this.insertAt(index + 1, newKey, value);
	}

	/**
	 * Assuming the map is sorted, insert a key-value pair
	 * preserving sort order
	 * @param {*} key
	 * @param {*} value
	 */
	setSorted (key, value, compare = (a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0) {
		for (let k of this.keys()) {
			if (compare([key, value], [k, this.get(k)]) < 0) {
				return this.insertBefore(k, key, value);
			}
		}

		this.set(key, value);
	}
}