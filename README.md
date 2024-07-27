# eleventy-plugin-outline

This plugin is the swiss army knife when it comes to creating outlines in Eleventy.

Features include:
- ✅ Numbering of headings and figures
- ✅ Render an outline for a whole document or just a page, using your own template
- ✅ Create cross-references to sections, figures, tables, etc.
- ✅ Works for both Markdown and HTML content
- ✅ Adds ids to headings if they don’t exist, respects them if they do exist.

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
> and any ids generated will also be unique within the scope.

Once content is processed, you can read the `outline` global data object to render an outline for the current URL,
or `outline[scope]` for a specific scope.

**When you have at most one scope per page,
cross-references will be processed automatically.**
However, when you have multiple scopes within the same page,
we can’t know which references belong to which scope, so you need to process them manually with the `xrefs` filter:

```njk
{{ content | xrefs(scope) | safe }}
```

## Syntax

### References

The plugin tries to introduce as little syntax as possible.
References are simply empty links, e.g. `[](#fig:myfigure)` in Markdown or `<a href="#my-section-id"></a>` in HTML.

### Sections

Any headings will be picked up by the plugin unless excluded by the `excludeHeadings` option (which takes a function).
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

## Data structure

The outline data structure the plugin builds has the following general structure:

```ts
class Outline extends Array<Heading> {

}

class Heading {
	id: string;

	// Iff the id was rewritten to be unique, this will contain the original
	originalId: string;

	// The heading level (1-6)
	level: number;

	// HTML attributes as a string. This includes id.
	attrs: string;

	// The original HTML content of the heading
	content: string;

	// The trimmed text content of the heading
	// With all elements stripped off
	text: string;

	// The full HTML of the heading
	html: string;

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

	// Child headings
	children: Outline;

	// Figures in this section (but not in children)
	figures: Figures;
}

class Figures extends Map<string, Figure> {

}

class Figure {
	id: string;

	// Iff the id was rewritten to be unique, this will contain the original
	originalId: string;

	// HTML attributes as a string. This includes id.
	attrs: string;

	// The original HTML content of the figure
	content: string;

	// The trimmed text content of the figure
	// With all elements stripped off
	text: string;

	// The full HTML of the figure
	html: string;

	index: number;

	// The page input path (e.g. "foo/index.md")
	inputPath: string;

	// The page output path (e.g. "foo/index.html")
	outputPath: string;

	// The page URL
	url: string;
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
eleventyConfig.addPlugin(outline);
```

if you have any plugins generating ids, make sure they are included before this one.

## Limitations

- Does not work well in watch mode.
