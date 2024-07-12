# eleventy-plugin-outline

This plugin is the swiss army knife when it comes to creating outlines in Eleventy,
but it’s also quite opinionated in how it does things.
It still affords plenty of customization, but via extensibility rather than configuration.

Features include:
- Numbering of headings and figures
- Render an outline for a whole document or just a page, using your own template
- Create cross-references to sections, figures, tables, etc.
- Works for both Markdown and HTML content

To-Do:
- Do not require ids on headings to be already present

## Usage

Use the `outline` filter on any content you want to process.
The filter does double duty: it both picks up headings and figures from the content passed,
and adds this info to the HTML.

```njk
{{ content | outline | safe }}
```

You can also pass a scope parameter, for any top-level information that cannot be determined from the content:

```njk
{{ content | outline(chapterNumber) | safe }}
```

This is useful when you render the same content in different contexts, like a whole book or a single chapter.

> [!WARNING]
> Any duplicate ids within the same scope are ignored. In the future I’m hoping to make this plugin smarter about this,
> but it’s nontrivial because it’s a design goal to be able to process the same content multiple times and still end up with the same outline.

Once content is processed, you can read the `outline` global data object to render the outline.
It’s keyed on the scope you passed.

## Syntax

### References

The plugin tries to introduce as little syntax as possible.
References are simply empty links, e.g. `[](#fig:myfigure)` in Markdown or `<a href="#my-section-id"></a>` in HTML.

### Sections

Any sections with ids that are processed via the `outline` filter will automatically take part in the outline.

> [!NOTE]
> In the future I’m hoping to add a way to automatically generate ids for headings that don’t have them,
> but for now you need to add them yourself, possibly via something like [`markdown-it-anchor`](https://www.npmjs.com/package/markdown-it-anchor).

### Figures and tables

TBD

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