import Outlines from "./Outlines.js";

export default function (config, options) {
	const outline = new Outlines(options);

	config.addGlobalData("outline", outline);

	// Pick up figures and headings
	config.addFilter("outline", function (content, scope = "") {
		return outline.process(content, scope, this);
	});

	// Replace empty xref links with labels like "Figure 3.2"
	config.addTransform("outline", function (content) {
		return outline.resolveXRefs(content, undefined, this);
	});
}

export { Outlines };
export { default as Outline } from "./Outline.js";