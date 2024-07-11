# eleventy-plugin-outline (WIP)

**A work in progress**

This plugin is the swiss army knife when it comes to creating outlines in Eleventy,
but it’s also quite opinionated in how it does things.
It still affords plenty of customization, but via extensibility rather than configuration.

Features include:
- [x] Numbering of headings and figures
- [x] Render an outline for a whole document or just a page, using your own template
- [ ] Create cross-references to headings, figures, tables, etc.


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

Then, after content is processed, you can read the `outline` global data object to render the outline.
It’s keyed on the scope you passed.