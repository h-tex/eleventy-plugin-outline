# eleventy-plugin-outline

This plugin is the swiss army knife when it comes to creating outlines in Eleventy.

Features include:
- ✅ Numbering of headings and figures
- ✅ Render an outline using your _own_ actual template
- ✅ Create cross-references to sections, figures, tables, etc.
- ✅ Works for both Markdown and HTML content. Will even pick up HTML headings in Markdown documents correctly.
- ✅ Adds ids to headings if they don’t exist, respects them if they do exist (but auto-resolves duplicates).
- ✅ Warns about heading jumps (e.g. going from `<h1>` to `<h3>` without an `<h2>`)
- ✅ Custom outline scopes allow you to create outlines that span multiple files (e.g. chapters in a book), or have multiple outlines within the same file
- ✅ Yes, cross-file cross-references do actually work! (for outlines that span multiple files)
- ✅ Customizable options for numbering, cross-references, and more


## Usage

Use the `outline` filter on any content you want to process.
The filter does double duty: it both picks up headings and figures from the content passed,
and adds this info to the HTML.

```njk
{{ content | outline | safe }}
```

By default, outlines are scoped to the output path (regardless of how many files it’s made up of).
However, somtimes you want outlines to span multiple output paths,
for example chapters in a book.
To join up outlines across multiple output paths (or create multiple separate outlines within the same output path),
you can use a scope argument:

```njk
{{ content | outline(scope) | safe }}
```

> [!WARNING]
> Ids need to be unique within a scope.
> If they are not, they will be rewritten to be unique (and produce a warning),
> Any ids generated are also unique within the scope.

Once content is processed, you can read ~~the `outline` global data object~~ _(TODO)_ `outlines[scope]` to render an outline for a specific scope.
If you did not specify a scope, it defaults to `page.url` so `outlines[page.url]` will contain the outline for the current page.

> [!WARNING]
> This will only include outlines for content that has gone through the `outline` filter at the time of rendering.

When you have at most one scope per page,
**cross-references will be processed automatically** via an 11ty transform.
However, when you have multiple scopes within the same page,
we can’t know which references belong to which scope, so you need to process them manually with the `xrefs` filter:

```njk
{{ content | xrefs(scope) | safe }}
```

> [!WARNING]
> Cross-references to other files (for scopes that span multiple files) are not yet processed,
> but this is a high-priority planned feature.

## Syntax

### References

The plugin tries to introduce as little syntax as possible.
References are simply empty links, e.g. `[](#fig:myfigure)` in Markdown or `<a href="#my-section-id"></a>` in HTML.
Even cross-references across files (for outlines that span multiple files) are just `[](/path/to/file/#my-section-id)`.

### Sections

Any headings will be picked up by the plugin unless excluded by the `exclude` option (which takes a function).
If they already have ids (e.g. via something like [`markdown-it-anchor`](https://www.npmjs.com/package/markdown-it-anchor)), they will be preserved.
If they don’t, ids that are unique within the specified scope will be generated for them.

> [!NOTE]
> In the future I’m hoping to add a way to exclude certain headings from the outline.

### Figures

Just use a regular HTML `<figure>` with an id.
This combines quite well with Markdown too, just make sure to leave a blank line between the `<figure>` and `<figcaption>` and their contents:

```markdown
<figure id="my-figure">

![A diagram where…](figures/diagram.svg)

<figcaption>

Progression of _Foo_ over time
</figcaption>
</figure>
```

### Tables

There are two ways to specify a table.
The recommended way is a `<figure>`, which also combines nicely with Markdown:

```markdown
<figure id="tab:my-table">

| Foo | Bar |
| --- | --- |
| 1   | 2   |

<figcaption>Table 1: Foo and Bar</figcaption>
</figure>
```

You don’t need to use a `tab:` prefix in your id, the plugin will figure it out automatically
if all your figure contains is a table.

You can also use a raw `<table>` with a `<caption>`:

```html
<table id="my-table">
  <caption>Table 1: Foo and Bar</caption>
  <thead>
	<tr>
	  <th>Foo</th>
	  <th>Bar</th>
	</tr>
  </thead>
  <tbody>
	<tr>
	  <td>1</td>
	  <td>2</td>
	</tr>
  </tbody>
</table>
```

## Specifying data explicitly

Sometimes you may want to specify data explicitly.
For example, for outlines that span multiple files, you have no control over the order the files are processed in,
so you’ll end up with non-deterministic top-level numbers!

Or, if you are combining content from multiple files into a single file,
cross-file references to the original files won't work correctly,
because all this plugin can see is the URL of the current page.

To explicitly override things, you can use `data-*` attributes on your headings:
- `data-number` to override the generated `qualifiedNumber`
- `data-label` to override the label
- `data-url` to override the page URL

## Data structures

The `outlines` global data is an `Outlines` object,
and each actual outline is an `Outline` object.

These objects have the structure below:

```ts
class OutlineItems extends Map<string, OutlineItem> {
	parent: OutlineItem;
	options: object;
	countsByType: Map<string, number>;

	get root ();

	get numberSeparator ();

	get qualifiedNumber ();

	get firstValue ();

	get lastValue ();
}

class OutlineItem {
	parent: OutlineItems;
	options: object;

	// Each subclass defines this to a distinct value
	// e.g. "heading" or "figure"
	kind: string;

	// Subtype, e.g. "chapter" or "appendix"
	type: string;

	id: string;

	// Iff the id was rewritten to be unique, this will contain the original
	originalId: string;

	// HTML attributes as a string. This includes id.
	attrs: string;

	// The original HTML content of the element
	content: string;

	// The trimmed text content of with all elements stripped off
	// For figures, this is the caption text
	text: string;

	// The full rendered HTML of the element
	html: string;

	// The original HTML of the element that was parsed
	originalHTML: string;

	// This section’s number (without parent numbers)
	// E.g. for section 1.2.3, this would be 3
	number: string;

	// The full number, including parent numbers
	qualifiedNumber: string;

	// The parent section’s qualified number, plus the separator
	qualifiedNumberPrefix: string;

	// The textual index of this heading in the content processed
	index: number;

	// The page input path (e.g. "foo/index.md")
	inputPath: string;

	// The page output path (e.g. "dist/foo/index.html")
	outputPath: string;

	// The page URL (e.g. "/foo/")
	url: string;
}

class Outline extends OutlineItems {
	// Will return this if it contains more than one top-level section
	// or the only top-level section if there is only one.
	// This is mainly useful for displaying tables of contents.
	get toc();
}

class Heading extends OutlineItem {
	// The heading level (1-6)
	level: number;

	// Child headings
	children: Outline;

	// Figures in this section (but not in children)
	figures: Figures;
}

class Figures extends OutlineItems {

}

class Figure extends OutlineItem {

}
```

## Installation

```sh
npm install eleventy-plugin-outline
```

Then, in your Eleventy config:

```js
import outline from 'eleventy-plugin-outline';
```

and add it to your Eleventy config:

```js
eleventyConfig.addPlugin(outline, {
	// Options
});
```

You can provide options to customize behavior.
For details on the options available, check out the [default options](src/defaultOptions.js).

if you have any plugins generating ids, make sure they are included before this one.

## Limitations

- Does not work well in watch mode.
