import OutlineItem from "./OutlineItem.js";

export default class Figure extends OutlineItem {
	kind = "figure";
	static defaultType = "figure";

	get qualifiedNumberPrefix () {
		return this.rootItem.qualifiedNumber + this.numberSeparator;
	}

	get progressRoot () {
		return this.parentItem?.progressRoot ?? this.rootItem;
	}

	get progress () {
		return this.start / this.progressRoot.length;
	}
}
