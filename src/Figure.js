import OutlineItem from "./OutlineItem.js";

export default class Figure extends OutlineItem {
	kind = "figure";
	static defaultType = "figure";

	get qualifiedNumber () {
		return this.rootPrefix + this.number;
	}
}