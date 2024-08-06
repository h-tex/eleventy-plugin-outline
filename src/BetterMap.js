export default class BetterMap extends Map {
	get firstValue () {
		return this.values().next().value;
	}

	get lastValue () {
		return [...this.values()].at(-1);
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

	keyAt (index) {
		return [...this.keys()][index];
	}

	valueAfter (value) {
		let values = [...this.values()];
		let index = values.indexOf(value);

		if (index === -1) {
			return null;
		}

		return values[index + 1];
	}

	sort (compare = ([a], [b]) => a < b ? -1 : a > b ? 1 : 0) {
		let entries = [...this.entries()].sort(compare);

		this.clear();

		for (let [key, value] of entries) {
			this.set(key, value);
		}
	}
}