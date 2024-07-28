import Outlines from "./Outlines.js";

export default function (config, options) {
	const outlines = new Outlines(options);

	config.addGlobalData("outlines", outlines);
	config.addGlobalData("eleventyComputed", {
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