export default class Outlines {
	getById (id) {
		for (let scope in this) {
			let outline = this[scope];
			let ret = outline.getById(id);
			if (ret) {
				return ret;
			}
		}

		return null;
	}
}