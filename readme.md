# craft

Static site generator from Markdown, with custom text transformer support via tags.

## Convention

Inspired by [Jekyll](https://jekyllrb.com/docs/structure/), an example directory structure looks like:

    .
    ├── config.json
    ├── _layouts
    |   ├── default.html
    |   └── post.html
    ├── _transpilers
    |   ├── quiz.js
    |   └── footnotes.js
    ├── news
    |   ├── hello_world.md
    |   └── new_announcement.md
    ├── blog
    |   ├── hello_world
    |       └── index.md
    |   └── bespoke_post
    |       └── _layouts
    |           └── bespoke_layout.html
    |       └── _transpilers
    |           └── references.js
    |       └── styles
    |           └── bespoke_styling.css
    |       └── index.md
    |   └── index.md
    ├── about
    |   └── index.md
    └── index.md

`craft` traverses the structure postorder (directories first, then files), populating its `environment` object with any metadata, layouts or text transformers it comes across.

These values can be templated into the generated files later on.

### config.json

This JSON file is read and stored as `environment.config` with two reserved keys:

* `ext_to_process`: files with these extensions will have their contents checked for front matter
* `ignored_filenames`: files and directories with these names will be ignored

Example `config.json`:

```
  {
      "ext_to_process": [".md", ".html"],
      "ignored_filenames": [".sass-cache", "scss", "config.json"]
  }
```

### _layouts

Files in this directory are stored as `environment.layouts.<layout_name>`. 

Example layout (e.g. `/_layouts/default.html`):

```
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My site</title>
    <link rel="stylesheet" href="{{url}}/css/default.css" type="text/css" media="all" />
{{#styles}}
    <link rel="stylesheet" href="{{url}}/{{.}}" type="text/css" media="all"/>
{{/styles}}
{{#scripts}}
    <script type="text/javascript" src="{{url}}/{{.}}"></script>
{{/scripts}}
</head>
<body>
    <header>
        Welcome to my website!
    </header>
    <main>
        {{{contents}}}
    </main>
    <footer>
        Made with craft
    </footer>
</body>
</html>
```

A file's contents are substituted in `{{{contents}}}`, and its metadata available for templating (e.g. the `styles` and `scripts` variables).

The corresponding metadata format in a file to template this out is:

```
---
layout: default
styles:
  - styles/blog.css
scripts:
  - blog/bespoke_post/scripts/bespoke_post.js
  - scripts/questions.js
...
---
# My first post

Hello world...
```

`_layout` directories can be created anywhere (does not have to be in the root directory); any repeated layout name will temporarily shadow the previously defined layout of ancestor until craft finishes that part of the traversal.

### _transpilers

The raison d'être for `craft` is the desire to use functions in the templating process.

Files in the `_transpilers` directory are written in [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1.1) format; any exported functions are available to the page being rendered.

These functions, intended for text transformations, are sugar on top of Mustache's [functions](https://github.com/janl/mustache.js#functions) and have the following signature:

    exports.printDescription = function(text, env) {
        return "<p>original text:" + text + "and page description: " + env.page.description + "</p>";
    }

Arguments passed through are the text that's been wrapped and the `environment` object.

This allows article-specific tags to be defined on the fly, where you can be as rigorous or as lax as you want regarding the lexing/parsing. The `environment` object can also be mutated (for page-specific information, consider modifying `env.page` as this will get discarded when processing the next page.

See [here](https://github.com/xdl/xiaodili_website/blob/master/src/blog/_transpilers/footnotes.js) for an example of a bidirectional, auto-incrementing footnote system, implemented in ~30 LoC.

Note that for brevity of authoring, transpilers are 'lifted' at the top level of the environment object given to the Mustache renderer, so avoid exporting transpiler functions with names that may clash with top level environment keys (e.g. `site` and `page`).

`_transpilers` directories can be created anywhere in the directory structure; similar to `_layouts`, any repeated transpiler function name will temporarily shadow the previously defined transpiler of ancestor until craft finishes that part of the traversal.

### Directories

These are traversed normally, unless specified to be ignored in `config.json`.

Nested directories can be referred to for aggregating posts, e.g. `environment.blog.colophon`, with `environment.blog.colophon.children` holding a list metadata of all child files in that directory.

## Files

`craft` uses [marked](https://github.com/chjj/marked) for Markdown conversion and [mustache](https://github.com/janl/mustache.js) for templating.

Files can contain metadata-related variables ('front matter') in YAML-format that are specified at the top of the file.

Like Jekyll, all files with the metadata defined (wrapped around `---`) will be subject to processing and templating.

The environment object is available in all files, which comes with the following reserved keys that may come in useful:

* `page`: metadata defined in the current file
    * `contents`: contains the contents of the unprocessed file
    * `layout`: defines what to wrap the contents in (see `_layouts`)
    * `export_to`: the file's metadata will be also appended into the `exports` list of the of the given node in `site`
* `url`: the root of the site (passed in from the command line)
* `site`: other files' metadata that `craft` has been populated with during its directory traversal

`.md` files are templated, then are processed with `marked`, whereas `.html` files are only templated.

### Aggregations

The following discusses ways to create an 'index' page of all child (e.g. for news, blog posts, projects).

Mustache has aggregates built in for free with [sections](https://github.com/janl/mustache.js#sections); the files are traversed post order, which means that a file will have access to the metadata of all its nephews and their descendants.

The metadata for the files in `/news` are accessed through the `site.news.children` array.

If there's a more complex directory structure, you can use the `export_to` key in children to export to an appropriate parent, then access it via `exports`, e.g. `site.blog.exports`.

Use the special `sort_by_descending` key to sort the aggregations by a certain key, e.g. importance or date, e.g:

```
---
title: Blog
layout: default
styles:
  - css/blog.css
sort_by_descending:
  site.blog.exports: date
---
<h1>Blog</h1>
<p>All blog entries will go here.</p>
{{#site.blog.exports}}
    <section>
        <header>
            <h2><a href="{{url}}/{{link}}">{{title}}</a></h2>
            <span>{{author}}, on {{date}}</span>
        </header>
        <p>{{description}}</p>
    </section>
{{/site.blog.exports}}
```

## Installation

With a version of Node that's >= v0.11.15, do:

    npm install

## Usage

Run with:

    node craft.js <src> <dist> [url]

The `url` argument is attached to the environment as `environment.url` and can be used to prepend to `script` and `link` tags - e.g. for local development, you might run:

    sudo node craft.js ~/dev/xiaodili/src /var/www/html http://localhost

## Motivation

Accustomed to taking notes in Markdown, I wanted the capability to add custom-defined tags whilst authoring - something that wasn't possible with Jekyll and Liquid. It was a fun exercise to hack on, and I was pleasantly surprised by how little code it took (~100 LoC in the core).

`craft` doesn't yet support pagination, watching for file changes, `includes` or many other Jekyll features; these will be added as needed and it will be interesting to see how many of these can be implemented with custom transpilers. For a well-documented, mature project with user-defined text transforming, check out [Hyde](http://hyde.github.io/).

The etymology comes from a slide from Andy Wingo's [talk](https://www.youtube.com/watch?v=TVO8WXFYDIA) at [Polyconf](http://polyconf.com/) where he associates the qualities of expressing creativity, the joy of building, bespokeness and increasing skill with the word 'craft'.

## Examples

* [Personal website](https://github.com/xdl/xiaodili_website)
