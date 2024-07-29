import Outlines from "./Outlines.js";

export default function (config, options) {
	const outlines = new Outlines(options);

	config.addGlobalData("outlines", outlines);
	let eleventyComputed = config.globalData.eleventyComputed ?? {};

	config.addGlobalData("eleventyComputed", {
		...eleventyComputed,
		outline (data) {
			let ret = outlines.get(undefined, data.page);

			return ret;
		}
	});

	// Pick up figures and headings
	config.addFilter("outline", function (content, scope) {
		return outlines.process(content, scope, this);
	});

	// Replace empty xref links with labels like "Figure 3.2"
	config.addTransform("outline", function (content) {
		return outlines.resolveXRefs(content, undefined, this);
	});

	// For control over scope
	config.addFilter("xrefs", function (content, scope) {
		return outlines.resolveXRefs(content, scope, this);
	});
}

export { Outlines };
export { default as Outline } from "./Outline.js";
export { default as OutlineItem } from "./OutlineItem.js";
export { default as OutlineItems } from "./OutlineItems.js";
export { default as Figure } from "./Figure.js";
export { default as Figures } from "./Figures.js";
export { default as Heading } from "./Heading.js";
export * as html from "./html.js";