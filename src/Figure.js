import OutlineItem from "./OutlineItem.js";

export default class Figure extends OutlineItem {
	kind = "figure";
	static defaultType = "figure";

	get qualifiedNumberPrefix () {
		return this.rootItem.qualifiedNumber + this.numberSeparator;
	}
}