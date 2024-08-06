import Heading from "./Heading.js";
import Figures from "./Figures.js";
import OutlineItems from "./OutlineItems.js";

export default class Outline extends OutlineItems {
	static of = Heading;

	urls = new Map();
	pageURLs = new Map();

	get level () {
		return 1 + (this.parent?.level ?? 0);
	}

	get length () {
		return this.end - this.start;
	}

	// Not currently used anywhere, but could be useful
	sort (
		compareFunction = (a, b) => {
			[a, b] = [a[1], b[1]];
			let ret = a.number - b.number;

			return isNaN(ret) ? a.number.localeCompare(b.number) : ret;
		}
	) {
		super.sort(compareFunction);
		this.needsSorting = false;
	}

	add (item) {
		let last = this.lastValue; // possibly ancestor

		// Add to last if either it's a heading with a higher level or it's a figure (no level)
		let isFigure = !item.level;
		let addToLast = last && (isFigure || item.level > last.level);

		if (addToLast) {
			// This is a child
			item = last.add(item);
		}
		else {
			// This is a top-level section
			if (isFigure) {
				this.figures ??= new Figures(this);
				item = this.figures.add(item);
			}
			else {
				if (last) {
					last.setEnd(item.start);
				}

				item = super.add(item);
			}
		}

		if (item.url && this.parent?.url !== item.url) {
			let urls = this.urls.get(item.url) ?? [];
			urls.push(item);
			this.urls.set(item.url, urls);
		}

		if (item.pageURL) {
			let pageURLs = this.pageURLs.get(item.pageURL) ?? [];
			pageURLs.push(item);
			this.pageURLs.set(item.pageURL, pageURLs);
		}

		this.index.set(item.id, item);

		return item;
	}

	setEnd (end) {
		this.end = end;
		this.lastValue?.setEnd(end);
	}
}

