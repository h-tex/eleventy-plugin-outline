import OutlineItems from "./OutlineItems.js";
import Figure from "./Figure.js";

export default class Figures extends OutlineItems {
	static of = Figure;

	get numberSeparator () {
		return this.options.figureNumberSeparator ?? ".";
	}

	get qualifiedNumber () {
		// Figure numbers are shallow, just <root>.<number>
		return this.root.qualifiedNumber ?? "";
	}
}
