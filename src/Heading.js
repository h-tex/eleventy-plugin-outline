import Outline from "./Outline.js";
import Figures from "./Figures.js";
import OutlineItem from "./OutlineItem.js";

export default class Heading extends OutlineItem {
	kind = "section";
	static defaultType = "section";

	// TODO chapter, appendix…
	constructor (info, options, parent) {
		super(info, options, parent);

		if (info.attributes["data-url"]) {
			this.url = info.attributes["data-url"];
		}
		else {
			this.url = this.parentItem?.url ?? this.pageURL;
		}

		if (this.parent?.level && this.parent.level < this.level - 1) {
			console.warn(`[outline] Level jump in ${this.url}: From ${this.parent} to ${this}`);
		}
	}

	getById (id) {
		if (this.id === id) {
			return this;
		}

		return this.children?.getById(id) ?? this.figures?.getById(id);
	}

	find (test, {descendIf} = {}) {
		if (typeof test === "function") {
			if (test(this) !== undefined) {
				return this;
			}
		}
		else if (typeof test === "object" && test !== null) {
			if (Object.keys(test).every(key => test[key] === this[key])) {
				return this;
			}

			if (test.level) {
				descendIf ??= info => info.level < test.level;
			}
		}

		if (this.children && this.level < 6 && (!descendIf || descendIf(this))) {
			return this.children.find(test, {descendIf});
		}
	}

	add (item) {
		let list;
		if (item.level) {
			// Is heading
			list = this.children ??= new Outline(this, this.options);
		}
		else {
			list = this.figures ??= new Figures(this, this.options);
		}

		item = list.add(item);

		this.index.set(item.id, item);
		return item;
	}

	// Note that the value of this will be incorrect if read too soon
	// When reading the first chunk in an outline, we can't know if we'll encounter other page URLs
	get progressRoot () {
		if (this.parent.pageURLs.size > 1) {
			return this;
		}
		else if (this.parentItem) {
			if (this.parentItem.pageURL !== this.pageURL) {
				// or this.parent?
				return this;
			}

			return this.parentItem.progressRoot;
		}
		else {
			return this.parent;
		}
	}

	get offset () {
		return this.start - this.progressRoot.start;
	}

	get length () {
		return this.end - this.start;
	}

	get progress () {
		return this.offset / this.progressRoot.length;
	}

	setEnd (end) {
		this.end = end;
		this.children?.setEnd(end);
	}
}
